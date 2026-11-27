package ca.qmaps.mobile

import org.json.JSONArray
import org.json.JSONObject
import java.net.URLEncoder

class DirectoryFilters(name: String, city: String) {
    val name = bound(name, 150)
    val city = bound(city, 120)

    fun path(after: String?, legacy: Boolean = false): String {
        val query = "q=${encode(name)}&city=${encode(city)}"
        if (legacy) return "places?$query"
        return "directory/results?$query&limit=24" + (after?.let { "&after=${encode(it)}" } ?: "")
    }

    private fun encode(value: String): String = URLEncoder.encode(value, Charsets.UTF_8.name())

    // Server limits are in UTF-16 code units. Do not split a surrogate pair.
    private fun bound(value: String, length: Int): String {
        val trimmed = value.trim()
        val bounded = trimmed.take(length)
        return if (trimmed.length > length && bounded.last().isHighSurrogate()) bounded.dropLast(1).trimEnd()
        else bounded.trimEnd()
    }
}

data class DirectoryListing(val id: String, val name: String, val city: String)
data class DirectoryPage(val listings: List<DirectoryListing>, val next: String?, val legacyLimited: Boolean = false)
private val cursorPattern = Regex("[A-Za-z0-9_-]{1,512}")

fun loadDirectoryPage(filters: DirectoryFilters, after: String?, request: (String) -> Any): DirectoryPage {
    val value = try {
        request(filters.path(after))
    } catch (error: ApiFailure) {
        // Older QMAPS production omits only this route. Do not hide any other error.
        if (after != null || error.status != 404 || !error.json || error.message != "Introuvable") throw error
        val legacy = request(filters.path(null, legacy = true)) as? JSONArray ?: invalidDirectoryResponse()
        return DirectoryPage(decodeDirectoryListings(legacy), null, legacy.length() >= 100)
    }
    val response = value as? JSONObject ?: invalidDirectoryResponse()
    val rows = response.optJSONArray("items") ?: invalidDirectoryResponse()
    if (rows.length() > 24) invalidDirectoryResponse()
    val next = when (val field = response.opt("next")) {
        JSONObject.NULL -> null
        is String -> field.takeIf(cursorPattern::matches) ?: invalidDirectoryResponse()
        else -> invalidDirectoryResponse()
    }
    return DirectoryPage(decodeDirectoryListings(rows), next)
}

private fun decodeDirectoryListings(rows: JSONArray): List<DirectoryListing> = List(rows.length()) { index ->
    val row = rows.optJSONObject(index) ?: invalidDirectoryResponse()
    val id = (row.opt("id") as? String)?.takeIf { it.isNotBlank() } ?: invalidDirectoryResponse()
    val name = row.opt("name") as? String ?: invalidDirectoryResponse()
    val city = row.opt("city") as? String ?: invalidDirectoryResponse()
    DirectoryListing(id, name, city)
}

private fun invalidDirectoryResponse(): Nothing = throw IllegalStateException("Réponse du catalogue invalide.")

// A fresh instance belongs to one applied search and one viewer. Request
// identities prevent a delayed completion from reusing a subsequent cursor.
class DirectoryPages(val filters: DirectoryFilters, private val viewer: String?) {
    class Request internal constructor(val after: String?)

    private var currentRequest: Request? = null
    private val seenIds = mutableSetOf<String>()
    private val consumedCursors = mutableSetOf<String>()
    private val rows = mutableListOf<DirectoryListing>()
    val listings: List<DirectoryListing> get() = rows
    var next: String? = null
        private set
    var loaded = false
        private set
    var legacyLimited = false
        private set
    var restart = false
        private set
    var message: String? = null
        private set
    val loading: Boolean get() = currentRequest != null

    fun belongsTo(token: String?): Boolean = viewer == token

    fun begin(token: String?): Request? {
        if (!belongsTo(token) || loading || restart || (loaded && next == null)) return null
        message = null
        return Request(next).also { currentRequest = it }
    }

    fun requestPage(request: Request, send: (String, String?) -> Any): DirectoryPage =
        loadDirectoryPage(filters, request.after) { send(it, viewer) }

    fun complete(request: Request, token: String?, page: DirectoryPage) {
        if (currentRequest !== request || !belongsTo(token)) return
        currentRequest = null
        loaded = true
        request.after?.let { consumedCursors.add(it) }
        val cursor = page.next
        if (cursor != null && cursor in consumedCursors) {
            next = null
            restart = true
            message = "La pagination a été interrompue."
            return
        }
        for (listing in page.listings) if (seenIds.add(listing.id)) rows.add(listing)
        legacyLimited = page.legacyLimited
        next = cursor
    }

    fun fail(request: Request, token: String?, error: Throwable) {
        if (currentRequest !== request || !belongsTo(token)) return
        currentRequest = null
        val status = (error as? ApiFailure)?.status
        if (status == 401 || (request.after != null && status == 409)) {
            rows.clear()
            next = null
            restart = true
            message = "La recherche a expiré."
        } else {
            message = error.message ?: "Connexion impossible"
        }
    }
}
