import csv
import hashlib
import io
import tempfile
import unittest
from email.message import Message
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlsplit

from scripts.verify_montreal_pilot import PilotRow, VerificationError, read_json, read_manifest, verify_host


ORIGIN = "https://qmaps.ca"
BATCH = "mtl-2026-11-27-v1"
RESULTS = "/api/v1/browser/directory/results"
DETAIL = "/api/v1/browser/places/"
HEADER = (
    "id_qmaps_propose", "reference_municipale", "nom", "adresse_publique",
    "ville", "province", "categorie_qmaps", "source", "licence",
)
ERROR = (ValueError, VerificationError)


def uuid(n):
    return f"f9000000-0000-5000-8000-{n:012d}"


ALPHA = PilotRow(uuid(1), "270001", 'Café "Le Goût", inc.', "48 rue d’Argenson, local 2")
BETA = PilotRow(uuid(2), "270002", "Restaurant Bêta", "50 rue d’Argenson")
EXTRA = PilotRow(uuid(3), "270003", "Restaurant hors manifeste", "52 rue d’Argenson")


def manifest_line(entry):
    return (
        entry.id, entry.reference, entry.name, entry.address, "Montréal", "QC",
        "restaurants", "Ville de Montréal — Établissements alimentaires", "CC BY 4.0",
    )


def manifest_bytes(rows, header=HEADER, *, bom=False):
    stream = io.StringIO(newline="")
    writer = csv.writer(stream, lineterminator="\r\n")
    writer.writerow(header)
    writer.writerows(rows)
    return (("\ufeff" if bom else "") + stream.getvalue()).encode("utf-8")


def detail(entry):
    return {
        "id": entry.id, "name": entry.name, "address": entry.address, "city": "Montréal",
        "latitude": None, "longitude": None, "hours_json": None,
        "attributes": {"qmaps_directory_import": {
            "source": "mtl_food", "external_id": entry.reference, "licence": "CC-BY-4.0",
            "cohort": BATCH,
        }},
    }


def listing(entry):
    return {
        **detail(entry), "status": "open", "is_claimed": False, "is_open": False,
        "phone": None, "website": None, "hours": None, "special_hours": None,
        "business_categories": [{
            "categories": {"id": uuid(99), "name": "Restaurants", "slug": "restaurants"},
        }],
    }


def unrelated(n):
    row = listing(PilotRow(uuid(n), str(n), f"Autre restaurant {n}", f"{n} rue Recette"))
    row["attributes"] = {}
    return row


def fixture_page(rows, cursor=None):
    return {"items": rows, "next": cursor}


class OfflineAPI:
    def __init__(self, pages, details=None):
        self.pages = pages
        self.details = details or {}
        self.calls = []

    def __call__(self, url, expected_status):
        parts = urlsplit(str(url))
        if f"{parts.scheme}://{parts.netloc}" != ORIGIN:
            raise AssertionError("Verifier left the requested canonical origin")
        query = parse_qs(parts.query)
        self.calls.append((parts.path, query.copy(), expected_status))
        if parts.path == RESULTS:
            if expected_status != 200:
                raise AssertionError("A missing results route cannot be treated as an empty page")
            cursor = query.pop("after", [None])[0]
            if query != {"city": ["Montréal"], "category": ["restaurants"],
                         "sort": ["recommended"], "limit": ["24"]}:
                raise AssertionError(f"Unexpected public search filters: {query!r}")
            result = self.pages[cursor]
        elif parts.path.startswith(DETAIL) and not query:
            result = self.details[parts.path.removeprefix(DETAIL)]
        else:
            raise AssertionError(f"Unexpected request path {parts.path}")
        if isinstance(result, Exception):
            raise result
        return result


class ManifestTests(unittest.TestCase):
    def write(self, raw):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        path = Path(directory.name) / "fixture.csv"
        path.write_bytes(raw)
        return path

    def test_optional_initial_bom_and_escaped_utf8_keep_exact_values_and_raw_hash(self):
        for bom in (False, True):
            with self.subTest(bom=bom):
                raw = manifest_bytes([manifest_line(ALPHA), manifest_line(BETA)], bom=bom)
                entries, digest = read_manifest(self.write(raw))
                self.assertEqual(entries, [ALPHA, BETA])
                self.assertEqual(digest, hashlib.sha256(raw).hexdigest())

    def test_rejects_bad_headers_and_misplaced_bom(self):
        for header in (
            (*HEADER[:-1], "email"),
            ("\ufeff" + HEADER[0], *HEADER[1:]),
            (*HEADER[:2], HEADER[3], HEADER[2], *HEADER[4:]),
        ):
            with self.subTest(header=header), self.assertRaises(ERROR):
                # The leading optional BOM is valid; another embedded in the
                # expected header is not.
                read_manifest(self.write(manifest_bytes([manifest_line(ALPHA)], header, bom=True)))

    def test_rejects_duplicate_id_and_duplicate_municipal_reference(self):
        for duplicate in (
            PilotRow(ALPHA.id, BETA.reference, BETA.name, BETA.address),
            PilotRow(BETA.id, ALPHA.reference, BETA.name, BETA.address),
        ):
            with self.subTest(duplicate=duplicate), self.assertRaises(ERROR):
                raw = manifest_bytes([manifest_line(ALPHA), manifest_line(duplicate)])
                read_manifest(self.write(raw))


class TransportTests(unittest.TestCase):
    def test_rejects_redirect_as_an_unauthenticated_get_without_echoing_body(self):
        headers = Message()
        headers["Content-Type"] = "application/json; charset=utf-8"
        headers["Location"] = "https://elsewhere.invalid/private"
        error = HTTPError(ORIGIN + RESULTS, 302, "Found", headers,
                          io.BytesIO(b'{"error":"private response body"}'))
        with patch("scripts.verify_montreal_pilot.build_opener") as opener:
            opener.return_value.open.side_effect = error
            with self.assertRaisesRegex(VerificationError, "HTTP 302") as rejected:
                read_json(ORIGIN + RESULTS, 200)
            handler = opener.call_args.args[0]
            request = opener.return_value.open.call_args.args[0]
            self.assertIsNone(handler.redirect_request(request, None, 302, "Found", headers, headers["Location"]))
            self.assertEqual(request.get_method(), "GET")
            self.assertFalse(request.has_header("Authorization"))
            self.assertFalse(request.has_header("Cookie"))
            self.assertNotIn("private", str(rejected.exception))


class PublicVerificationTests(unittest.TestCase):
    def test_reads_both_pages_then_checks_each_public_detail(self):
        first = [listing(ALPHA)] + [unrelated(n) for n in range(100, 123)]
        api = OfflineAPI({None: fixture_page(first, "after_1"), "after_1": fixture_page([listing(BETA)])},
                         {row.id: detail(row) for row in (ALPHA, BETA)})
        outcome = verify_host(ORIGIN, [ALPHA, BETA], BATCH, "published", request=api)
        self.assertIsInstance(outcome, dict)
        self.assertEqual([path for path, _, _ in api.calls], [RESULTS, RESULTS, DETAIL + ALPHA.id, DETAIL + BETA.id])
        self.assertEqual([status for _, _, status in api.calls], [200, 200, 200, 200])
        self.assertNotIn("after", api.calls[0][1])
        self.assertEqual(api.calls[1][1]["after"], ["after_1"])

    def test_published_requires_the_exact_cohort_not_only_existing_details(self):
        for rows in ([], [listing(ALPHA), listing(EXTRA)]):
            with self.subTest(found=len(rows)), self.assertRaises(ERROR):
                api = OfflineAPI({None: fixture_page(rows)}, {ALPHA.id: detail(ALPHA)})
                verify_host(ORIGIN, [ALPHA], BATCH, "published", request=api)

    def test_listing_rejects_stale_attribution_and_invented_public_metadata(self):
        for key, value in (
            ("cohort", "mtl-2026-11-26-old"), ("external_id", "270099"), ("licence", "ODbL-1.0"),
            ("source", "on2go.ca"), ("is_claimed", True), ("is_open", 0), ("hours", "24/7"),
            ("phone", "514-555-0100"), ("website", "https://example.invalid"),
            ("hours_json", {}), ("latitude", 45.5), ("longitude", -73.5), ("city", "Laval"),
        ):
            row = listing(ALPHA)
            target = row["attributes"]["qmaps_directory_import"] if key in ("cohort", "external_id", "licence", "source") else row
            target[key] = value
            with self.subTest(field=key), self.assertRaises(ERROR):
                api = OfflineAPI({None: fixture_page([row])}, {ALPHA.id: detail(ALPHA)})
                verify_host(ORIGIN, [ALPHA], BATCH, "published", request=api)

    def test_detail_rejects_mismatched_listing_or_missing_explicit_null(self):
        stale_marker = detail(ALPHA)["attributes"]
        stale_marker["qmaps_directory_import"]["cohort"] = "mtl-2026-11-26-old"
        for key, value in (
            ("name", "Commerce différent"), ("address", "22 rue Différente"), ("city", "Laval"),
            ("latitude", 45.5), ("longitude", -73.5), ("hours_json", None),
            ("attributes", {}), ("attributes", stale_marker),
        ):
            place = detail(ALPHA)
            if key == "hours_json":
                place.pop(key)
            else:
                place[key] = value
            with self.subTest(field=key), self.assertRaises(ERROR):
                api = OfflineAPI({None: fixture_page([listing(ALPHA)])}, {ALPHA.id: place})
                verify_host(ORIGIN, [ALPHA], BATCH, "published", request=api)

    def test_absent_requires_no_candidate_in_pages_and_exact_public_404(self):
        empty = {None: fixture_page([unrelated(100)])}
        api = OfflineAPI(empty, {ALPHA.id: {"error": "Introuvable"}})
        verify_host(ORIGIN, [ALPHA], BATCH, "absent", request=api)
        self.assertEqual(api.calls[-1], (DETAIL + ALPHA.id, {}, 404))
        for rows, response in (
            ([listing(ALPHA)], {"error": "Introuvable"}),
            ([listing(EXTRA)], {"error": "Introuvable"}),
            ([unrelated(100)], {"error": "Fiche introuvable"}),
            ([unrelated(100)], detail(ALPHA)),
        ):
            with self.subTest(rows=len(rows), response=response), self.assertRaises(ERROR):
                wrong = OfflineAPI({None: fixture_page(rows)}, {ALPHA.id: response})
                verify_host(ORIGIN, [ALPHA], BATCH, "absent", request=wrong)

    def test_rejects_a_predeployment_404_on_the_results_route(self):
        api = OfflineAPI({None: VerificationError("HTTP 404")})
        with self.assertRaises(ERROR):
            verify_host(ORIGIN, [ALPHA], BATCH, "absent", request=api)
        self.assertEqual(len(api.calls), 1)

    def test_rejects_cross_page_duplicate_cursor_cycles_and_page_limit(self):
        first = [unrelated(n) for n in range(100, 124)]
        second = [unrelated(n) for n in range(200, 224)]
        third = [unrelated(n) for n in range(300, 324)]
        for name, pages, limit in (
            ("duplicate ID", {None: fixture_page(first, "a"), "a": fixture_page([first[-1]])}, 100),
            ("cursor cycle", {None: fixture_page(first, "a"), "a": fixture_page(second, "b"),
                              "b": fixture_page(third, "a")}, 100),
            ("page limit", {None: fixture_page(first, "a"), "a": fixture_page(second, "b")}, 2),
        ):
            with self.subTest(name=name), self.assertRaises(ERROR):
                api = OfflineAPI(pages)
                verify_host(ORIGIN, [ALPHA], BATCH, "absent", request=api, max_pages=limit)


if __name__ == "__main__":
    unittest.main()
