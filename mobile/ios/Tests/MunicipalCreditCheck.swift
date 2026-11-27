import Foundation

@main
struct MunicipalCreditCheck {
    static func main() throws {
        func place(attributes: Any? = nil) throws -> Place {
            var payload: [String: Any] = ["id": "fixture", "name": "Restaurant de recette", "city": "Montréal"]
            payload["attributes"] = attributes
            return try JSONDecoder().decode(Place.self, from: JSONSerialization.data(withJSONObject: payload))
        }

        func marker(source: Any = "mtl_food", licence: Any = "CC-BY-4.0", reference: Any = "123") -> [String: Any] {
            ["qmaps_directory_import": ["source": source, "licence": licence, "external_id": reference,
                                        "url": "https://unused.invalid/"]]
        }

        for reference in ["1", "123", "12345678901234567890"] {
            let decoded = try place(attributes: marker(reference: reference))
            precondition(decoded.attributes?.reference == reference)
        }
        let invalids: [Any] = ["", "0", "0123", "-1", "1\n", "1 2", "١٢", "123456789012345678901", 123, NSNull()]
        for reference in invalids {
            let decoded = try place(attributes: marker(reference: reference))
            precondition(decoded.attributes?.reference == nil)
        }
        let malformed: [Any?] = [nil, NSNull(), [], ["qmaps_directory_import": "wrong"],
            marker(source: "on2go.ca"), marker(source: "MTL_FOOD"), marker(licence: "ODbL-1.0")]
        for attributes in malformed {
            let decoded = try place(attributes: attributes)
            precondition(decoded.attributes?.reference == nil && decoded.name == "Restaurant de recette")
        }
        precondition(MunicipalListingCredit.sourceURL.absoluteString == "https://www.donneesquebec.ca/recherche/dataset/vmtl-etablissements-alimentaires")
        precondition(MunicipalListingCredit.licenceURL.absoluteString == "https://creativecommons.org/licenses/by/4.0/deed.fr")
        print("Municipal attribution decoding passed")
    }
}
