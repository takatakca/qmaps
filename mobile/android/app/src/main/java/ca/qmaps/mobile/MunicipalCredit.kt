package ca.qmaps.mobile

import org.json.JSONObject

object MunicipalCredit {
    const val sourceUrl = "https://www.donneesquebec.ca/recherche/dataset/vmtl-etablissements-alimentaires"
    const val licenceUrl = "https://creativecommons.org/licenses/by/4.0/deed.fr"
    private val referencePattern = Regex("[1-9][0-9]{0,19}")

    fun reference(detail: JSONObject): String? {
        val marker = detail.optJSONObject("attributes")?.optJSONObject("qmaps_directory_import") ?: return null
        if (marker.opt("source") != "mtl_food" || marker.opt("licence") != "CC-BY-4.0") return null
        val value = marker.opt("external_id") as? String ?: return null
        return value.takeIf(referencePattern::matches)
    }
}
