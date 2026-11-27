import Foundation

@main
struct DirectoryPagesCheck {
    static func main() throws {
        let filters = DirectoryFilters(name: "  Café A+B\n", city: " Montréal ")
        precondition(filters.isValid)
        precondition(filters.legacyQuery == [
            URLQueryItem(name: "q", value: "Café A+B"),
            URLQueryItem(name: "city", value: "Montréal"),
        ])
        precondition(filters.query(after: nil).map(\.name) == ["q", "city", "limit"])
        let opaque = "Ab_1-2"
        precondition(filters.query(after: opaque) == filters.query(after: nil) + [
            URLQueryItem(name: "after", value: opaque),
        ])
        precondition(filters.query(after: nil).last?.value == "24")
        precondition(DirectoryFilters(name: String(repeating: "é", count: 150), city: String(repeating: "x", count: 120)).isValid)
        precondition(!DirectoryFilters(name: String(repeating: "🍽", count: 76), city: "").isValid)
        precondition(!DirectoryFilters(name: "", city: String(repeating: "a", count: 121)).isValid)

        precondition(DirectoryFilters.allowsLegacy(after: nil, status: 404, jsonMessage: "Introuvable"))
        precondition(!DirectoryFilters.allowsLegacy(after: opaque, status: 404, jsonMessage: "Introuvable"))
        precondition(!DirectoryFilters.allowsLegacy(after: nil, status: 404, jsonMessage: nil))
        precondition(!DirectoryFilters.allowsLegacy(after: nil, status: 404, jsonMessage: "Fiche introuvable"))
        for status in [400, 401, 403, 409, 500, 503] {
            precondition(!DirectoryFilters.allowsLegacy(after: nil, status: status, jsonMessage: "Introuvable"))
        }

        func row(_ id: String) -> [String: String] { ["id": id, "name": "Commerce " + id, "city": "Montréal"] }
        func page(_ ids: [String], next: String?) throws -> DirectoryPage {
            let cursor: Any = next.map { $0 as Any } ?? NSNull()
            let data = try JSONSerialization.data(withJSONObject: ["items": ids.map(row), "next": cursor])
            return try JSONDecoder().decode(DirectoryPage.self, from: data)
        }
        for invalid in [
            "[]", "{}", "{\"items\":[]}", "{\"items\":[],\"next\":\"\"}", "{\"items\":[],\"next\":7}",
            "{\"items\":{},\"next\":null}", "{\"items\":[{\"id\":\"123\"}],\"next\":null}",
        ] {
            let decoded = try? JSONDecoder().decode(DirectoryPage.self, from: Data(invalid.utf8))
            precondition(decoded == nil)
        }
        let oversized = try? page(Array(repeating: "1", count: 25), next: nil)
        precondition(oversized == nil)
        for invalidCursor in ["abc def", "abc\ndef", "déf", "abc+/=", String(repeating: "_", count: 513)] {
            let decoded = try? page([], next: invalidCursor)
            precondition(decoded == nil)
        }

        var pages = DirectoryPages()
        try pages.append(page([], next: opaque))
        precondition(pages.items.isEmpty && pages.next == opaque && !pages.legacyCapped)
        try pages.append(page(["1", "1", "2"], next: "second"))
        precondition(pages.items.map(\.id) == ["1", "2"] && pages.next == "second")
        do {
            try pages.append(page(["discarded"], next: opaque))
            preconditionFailure("A repeated cursor must fail before appending anything")
        } catch DirectoryPageError.repeatedCursor {
            precondition(pages.items.map(\.id) == ["1", "2"] && pages.next == "second")
        }
        try pages.append(page(["2", "3"], next: nil))
        precondition(pages.items.map(\.id) == ["1", "2", "3"] && pages.next == nil)

        let legacyData = try JSONSerialization.data(withJSONObject: (0..<100).map { row(String($0)) })
        let legacy = try JSONDecoder().decode([Place].self, from: legacyData)
        pages.replaceWithLegacy(legacy)
        precondition(pages.items.count == 100 && pages.next == nil && pages.legacyCapped)
        pages.replaceWithLegacy(Array(legacy.prefix(99)))
        precondition(pages.items.count == 99 && pages.next == nil && !pages.legacyCapped)
        print("Directory pagination decoding, query and continuity passed")
    }
}
