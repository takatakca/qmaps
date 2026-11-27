package ca.qmaps.mobile.test

import ca.qmaps.mobile.ApiFailure
import ca.qmaps.mobile.DirectoryFilters
import ca.qmaps.mobile.DirectoryListing
import ca.qmaps.mobile.DirectoryPage
import ca.qmaps.mobile.DirectoryPages
import ca.qmaps.mobile.decodeApiFailure
import ca.qmaps.mobile.loadDirectoryPage
import org.json.JSONArray
import org.json.JSONObject

fun verifyDirectoryPages() {
    val filters = DirectoryFilters("  Café + Fils  ", "  Montréal  ")
    val cursor = "cursor_A-2"
    val firstPath = "directory/results?q=Caf%C3%A9+%2B+Fils&city=Montr%C3%A9al&limit=24"
    val legacyPath = "places?q=Caf%C3%A9+%2B+Fils&city=Montr%C3%A9al"
    check(filters.path(null) == firstPath)
    check(filters.path(cursor) == "$firstPath&after=cursor_A-2")
    check(filters.path("mots+/= &c=é") == "$firstPath&after=mots%2B%2F%3D+%26c%3D%C3%A9")
    check(DirectoryFilters("a".repeat(149) + "🙂", "M".repeat(121)).name.length == 149)
    check(DirectoryFilters("", "M".repeat(121)).city.length == 120)

    fun jsonListing(id: String) = JSONObject().put("id", id).put("name", "Commerce de recette").put("city", "Montréal")
    fun rows(count: Int) = JSONArray().apply { repeat(count) { put(jsonListing("row-$it")) } }
    fun jsonPage(count: Int, next: String?) = JSONObject().put("items", rows(count)).put("next", next ?: JSONObject.NULL)

    val page = loadDirectoryPage(filters, null) { path ->
        check(path == firstPath)
        jsonPage(2, cursor)
    }
    check(page.listings.map { it.id } == listOf("row-0", "row-1") && page.next == cursor)
    check(loadDirectoryPage(filters, cursor) { jsonPage(0, null) }.next == null)
    for (size in listOf(2, 100)) {
        val calls = mutableListOf<String>()
        val legacy = loadDirectoryPage(filters, null) { path ->
            calls += path
            if (path == firstPath) throw decodeApiFailure(404, "application/json; charset=utf-8", """{"error":"Introuvable"}""")
            rows(size)
        }
        check(calls == listOf(firstPath, legacyPath))
        check(legacy.listings.size == size && legacy.next == null && legacy.legacyLimited == (size == 100))
    }
    for ((after, status, reason) in listOf(
        Triple(cursor, 404, "Introuvable"), Triple(null, 404, "Autre erreur"), Triple(null, 500, "Introuvable"),
        Triple(null, 401, "Connexion requise"), Triple(cursor, 409, "Curseur périmé")
    )) {
        var calls = 0
        val error = ApiFailure(status, reason, json = true)
        val failure = runCatching { loadDirectoryPage(filters, after) { calls++; throw error } }
        check(calls == 1 && failure.exceptionOrNull() === error)
    }
    for ((type, body) in listOf(
        "text/html" to "<h1>Introuvable</h1>", "text/plain" to """{"error":"Introuvable"}""",
        "application/json" to "{\"error\":\"Introuvable\"", "application/json" to """{"error":"Introuvable"}junk"""
    )) {
        val error = decodeApiFailure(404, type, body)
        var calls = 0
        check(!error.json && runCatching { loadDirectoryPage(filters, null) { calls++; throw error } }.isFailure && calls == 1)
    }
    for (bad in listOf(rows(2), JSONObject().put("items", rows(2)), jsonPage(25, null),
        jsonPage(2, ""), jsonPage(2, "x".repeat(513)), jsonPage(2, "cursor/?"))) {
        var calls = 0
        check(runCatching { loadDirectoryPage(filters, null) { calls++; bad } }.isFailure && calls == 1)
    }

    val viewer = "test-account-a"
    val replaced = "test-account-b"
    fun listing(id: String) = DirectoryListing(id, "Commerce de recette $id", "Montréal")
    val pages = DirectoryPages(filters, viewer)
    check(pages.begin(replaced) == null)
    val initial = checkNotNull(pages.begin(viewer))
    check(pages.begin(viewer) == null)
    val initialPage = pages.requestPage(initial) { path, auth ->
        check(auth == viewer && path == firstPath)
        jsonPage(1, cursor)
    }
    pages.complete(initial, replaced, initialPage)
    check(pages.loading && pages.listings.isEmpty())
    pages.complete(initial, viewer, initialPage)
    check(pages.listings.map { it.id } == listOf("row-0") && pages.next == cursor)
    val next = checkNotNull(pages.begin(viewer))
    check(next.after == cursor)
    pages.fail(next, viewer, IllegalStateException("Réseau indisponible"))
    check(pages.listings.size == 1 && pages.next == cursor && !pages.restart && pages.message == "Réseau indisponible")
    val retry = checkNotNull(pages.begin(viewer))
    check(retry.after == cursor && retry !== next)
    pages.complete(next, viewer, DirectoryPage(listOf(listing("obsolete")), null))
    check(pages.loading && pages.listings.size == 1)
    pages.complete(retry, viewer, DirectoryPage(listOf(listing("row-0"), listing("later")), "next-2"))
    check(pages.listings.map { it.id } == listOf("row-0", "later") && pages.next == "next-2")
    val third = checkNotNull(pages.begin(viewer))
    pages.complete(third, viewer, DirectoryPage(listOf(listing("not-appended")), cursor))
    check(pages.next == null && pages.restart && pages.begin(viewer) == null && pages.listings.size == 2)

    for (status in listOf(401, 409)) {
        val scoped = DirectoryPages(filters, viewer)
        val start = checkNotNull(scoped.begin(viewer))
        scoped.complete(start, viewer, DirectoryPage(listOf(listing("private")), cursor))
        val more = checkNotNull(scoped.begin(viewer))
        scoped.fail(more, replaced, ApiFailure(status, "Obsolète"))
        check(scoped.loading && scoped.listings.size == 1)
        scoped.fail(more, viewer, ApiFailure(status, "Expirée"))
        check(scoped.restart && scoped.next == null && scoped.listings.isEmpty() && scoped.begin(viewer) == null)
    }
}
