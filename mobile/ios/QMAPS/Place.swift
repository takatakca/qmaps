import Foundation

struct Place: Identifiable, Decodable {
    let id, name, city: String
    let address, description: String?
    let can_block: Bool?
    let attributes: MunicipalListingCredit?
}

struct DirectoryFilters {
    static let pageSize = 24
    let name: String
    let city: String

    init(name: String, city: String) {
        self.name = name.trimmingCharacters(in: .whitespacesAndNewlines)
        self.city = city.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    var isValid: Bool { name.utf16.count <= 150 && city.utf16.count <= 120 }

    var legacyQuery: [URLQueryItem] {
        [URLQueryItem(name: "q", value: name), URLQueryItem(name: "city", value: city)]
    }

    func query(after: String?) -> [URLQueryItem] {
        var items = legacyQuery + [URLQueryItem(name: "limit", value: String(Self.pageSize))]
        if let after { items.append(URLQueryItem(name: "after", value: after)) }
        return items
    }

    static func allowsLegacy(after: String?, status: Int, jsonMessage: String?) -> Bool {
        after == nil && status == 404 && jsonMessage == "Introuvable"
    }
}

struct DirectoryPage: Decodable {
    let items: [Place]
    let next: String?

    private enum Key: String, CodingKey { case items, next }

    init(from decoder: Decoder) throws {
        let value = try decoder.container(keyedBy: Key.self)
        items = try value.decode([Place].self, forKey: .items)
        guard items.count <= DirectoryFilters.pageSize else {
            throw DecodingError.dataCorruptedError(forKey: .items, in: value, debugDescription: "Page trop grande")
        }
        // The server must explicitly send either an opaque cursor or null.
        if try value.decodeNil(forKey: .next) {
            next = nil
        } else {
            let cursor = try value.decode(String.self, forKey: .next)
            guard (1...512).contains(cursor.utf8.count), cursor.utf8.allSatisfy({ byte in
                switch byte {
                case 48...57, 65...90, 97...122, 45, 95: return true
                default: return false
                }
            }) else {
                throw DecodingError.dataCorruptedError(forKey: .next, in: value, debugDescription: "Curseur invalide")
            }
            next = cursor
        }
    }
}

enum DirectoryPageError: Error { case repeatedCursor }

struct DirectoryPages {
    private(set) var items: [Place] = []
    private(set) var next: String?
    private(set) var legacyCapped = false
    private var seenIds: Set<String> = []
    private var seenCursors: Set<String> = []

    mutating func append(_ page: DirectoryPage) throws {
        if let cursor = page.next, !seenCursors.insert(cursor).inserted { throw DirectoryPageError.repeatedCursor }
        add(page.items)
        next = page.next
    }

    mutating func replaceWithLegacy(_ rows: [Place]) {
        self = DirectoryPages()
        legacyCapped = rows.count == 100
        add(rows)
    }

    private mutating func add(_ rows: [Place]) {
        for row in rows where seenIds.insert(row.id).inserted { items.append(row) }
    }
}

struct MunicipalListingCredit: Decodable {
    static let sourceURL = URL(string: "https://www.donneesquebec.ca/recherche/dataset/vmtl-etablissements-alimentaires")!
    static let licenceURL = URL(string: "https://creativecommons.org/licenses/by/4.0/deed.fr")!

    private enum AttributesKey: String, CodingKey { case directoryImport = "qmaps_directory_import" }
    private enum MarkerKey: String, CodingKey {
        case source, licence
        case reference = "external_id"
    }

    let reference: String?

    init(from decoder: Decoder) {
        // Optional or malformed metadata must not prevent displaying the place.
        guard let attributes = try? decoder.container(keyedBy: AttributesKey.self),
              let marker = try? attributes.nestedContainer(keyedBy: MarkerKey.self, forKey: .directoryImport),
              (try? marker.decode(String.self, forKey: .source)) == "mtl_food",
              (try? marker.decode(String.self, forKey: .licence)) == "CC-BY-4.0",
              let value = try? marker.decode(String.self, forKey: .reference),
              (1...20).contains(value.utf8.count),
              let first = value.utf8.first, (49...57).contains(first),
              value.utf8.allSatisfy({ (48...57).contains($0) }) else {
            reference = nil
            return
        }
        reference = value
    }
}
