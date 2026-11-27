import Foundation

struct Place: Identifiable, Decodable {
    let id, name, city: String
    let address, description: String?
    let can_block: Bool?
    let attributes: MunicipalListingCredit?
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
