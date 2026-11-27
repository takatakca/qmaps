package ca.qmaps.mobile.test

import ca.qmaps.mobile.MunicipalCredit
import org.json.JSONArray
import org.json.JSONObject

fun verifyMunicipalCredit() {
    fun detail(source: Any = "mtl_food", licence: Any = "CC-BY-4.0", reference: Any = "123") =
        JSONObject().put("attributes", JSONObject().put("qmaps_directory_import", JSONObject()
            .put("source", source).put("licence", licence).put("external_id", reference)
            .put("url", "https://unused.invalid/")))

    for (accepted in listOf("1", "123", "12345678901234567890")) {
        check(MunicipalCredit.reference(detail(reference = accepted)) == accepted)
    }
    for (invalid in listOf("", "0", "0123", "-1", "1\n", "1 2", "١٢", "123456789012345678901", 123, JSONObject.NULL)) {
        check(MunicipalCredit.reference(detail(reference = invalid)) == null)
    }
    check(MunicipalCredit.reference(detail(source = "on2go.ca")) == null)
    check(MunicipalCredit.reference(detail(source = "MTL_FOOD")) == null)
    check(MunicipalCredit.reference(detail(licence = "ODbL-1.0")) == null)
    check(MunicipalCredit.reference(JSONObject()) == null)
    check(MunicipalCredit.reference(JSONObject().put("attributes", JSONArray())) == null)
    check(MunicipalCredit.reference(JSONObject().put("attributes", JSONObject().put("qmaps_directory_import", "wrong"))) == null)
    check(MunicipalCredit.sourceUrl == "https://www.donneesquebec.ca/recherche/dataset/vmtl-etablissements-alimentaires")
    check(MunicipalCredit.licenceUrl == "https://creativecommons.org/licenses/by/4.0/deed.fr")
}
