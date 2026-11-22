import Foundation
import Security
import SwiftUI

enum APIError: LocalizedError {
    case failed(String)
    var errorDescription: String? { if case .failed(let message) = self { return message }; return nil }
}
struct Place: Identifiable, Decodable {
    let id, name, city: String
    let address, description: String?
    let can_block: Bool?
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
    func request<T: Decodable>(_ path: String, method: String = "GET", query: [URLQueryItem] = [], body: [String: Any]? = nil) async throws -> T {
        var url = URLComponents(string: "https://qmaps.ca/api/v1/" + path)!
        if !query.isEmpty {
            url.queryItems = query
            url.percentEncodedQuery = url.percentEncodedQuery?.replacingOccurrences(of: "+", with: "%2B")
        }
        var req = URLRequest(url: url.url!, timeoutInterval: 18)
        req.httpMethod = method
        if let token { req.setValue("Bearer " + token, forHTTPHeaderField: "Authorization") }
        if let body {
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
            req.httpBody = try JSONSerialization.data(withJSONObject: body)
        }
        let (data, response) = try await URLSession.shared.data(for: req)
        guard let res = response as? HTTPURLResponse else { throw APIError.failed("Réponse invalide") }
        guard (200..<300).contains(res.statusCode) else {
            if res.statusCode == 401 && token != nil { try apply(nil) }
            let value = try? JSONDecoder().decode(Message.self, from: data)
            throw APIError.failed(value?.error ?? "Service indisponible")
        }
        if T.self == Empty.self { return try JSONDecoder().decode(T.self, from: Data("{}".utf8)) }
        return try JSONDecoder().decode(T.self, from: data)
    }
}
