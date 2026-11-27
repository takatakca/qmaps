import Foundation
import Security
import SwiftUI

enum APIError: LocalizedError {
    case failed(String)
    var errorDescription: String? { if case .failed(let message) = self { return message }; return nil }
}
struct APIHTTPError: LocalizedError {
    let status: Int
    let message: String?
    let isJSON: Bool
    var errorDescription: String? { message ?? "Service indisponible" }
}
enum DirectoryReply {
    case page(DirectoryPage)
    case legacy([Place])
}
struct PublisherTerms: Decodable { let accepted: Bool; let version: String }
struct BlockedPublisher: Identifiable, Decodable { let id, label: String }
struct Story: Identifiable, Decodable { let id, title, body: String }
struct Settings: Decodable { let reservations, waitlist: Bool }
struct AccountResult: Decodable { let token, handle: String; let recovery_code: String? }
struct Empty: Decodable {}
struct Message: Decodable { let error: String }

enum Vault {
    private static let base: [String: Any] = [kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: "ca.qmaps.mobile.session", kSecAttrAccount as String: "current"]
    static func read() -> String? {
        var query = base
        query[kSecReturnData as String] = true
        var result: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }
    static func store(_ value: String?) throws {
        guard let value else { SecItemDelete(base as CFDictionary); return }
        let data = Data(value.utf8)
        let updated = SecItemUpdate(base as CFDictionary, [kSecValueData as String: data] as CFDictionary)
        if updated == errSecSuccess { return }
        guard updated == errSecItemNotFound else { throw APIError.failed("Trousseau indisponible") }
        var item = base
        item[kSecValueData as String] = data
        item[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        guard SecItemAdd(item as CFDictionary, nil) == errSecSuccess else { throw APIError.failed("Enregistrement de session impossible") }
    }
}

@MainActor
final class Session: ObservableObject {
    @Published private(set) var token = Vault.read()
    func apply(_ next: String?) throws { try Vault.store(next); token = next }
    func directoryPage(_ filters: DirectoryFilters, after: String?) async throws -> DirectoryReply {
        let viewer = token
        do {
            let page: DirectoryPage = try await request("directory/results", query: filters.query(after: after))
            return .page(page)
        } catch let failure as APIHTTPError where DirectoryFilters.allowsLegacy(after: after,
            status: failure.status, jsonMessage: failure.isJSON ? failure.message : nil) && token == viewer {
            try Task.checkCancellation()
            let rows: [Place] = try await request("places", query: filters.legacyQuery)
            return .legacy(rows)
        }
    }
    func request<T: Decodable>(_ path: String, method: String = "GET", query: [URLQueryItem] = [], body: [String: Any]? = nil) async throws -> T {
        var url = URLComponents(string: "https://qmaps.ca/api/v1/" + path)!
        if !query.isEmpty {
            url.queryItems = query
            url.percentEncodedQuery = url.percentEncodedQuery?.replacingOccurrences(of: "+", with: "%2B")
        }
        var req = URLRequest(url: url.url!, timeoutInterval: 18)
        req.httpMethod = method
        let requestToken = token
        if let requestToken { req.setValue("Bearer " + requestToken, forHTTPHeaderField: "Authorization") }
        if let body {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        let (data, response) = try await URLSession.shared.data(for: req)
        try Task.checkCancellation()
        guard let res = response as? HTTPURLResponse else { throw APIError.failed("Réponse invalide") }
        guard (200..<300).contains(res.statusCode) else {
            if res.statusCode == 401 && requestToken != nil && token == requestToken { try apply(nil) }
            let value = try? JSONDecoder().decode(Message.self, from: data)
            throw APIHTTPError(status: res.statusCode, message: value?.error,
                               isJSON: res.mimeType?.lowercased() == "application/json")
        }
        if T.self == Empty.self { return try JSONDecoder().decode(T.self, from: Data("{}".utf8)) }
        return try JSONDecoder().decode(T.self, from: data)
    }
}
