#!/usr/bin/env python3
"""Check a reviewed Montréal pilot over the public API, without writing anything."""

import argparse
import csv
from dataclasses import dataclass
import hashlib
from http.client import HTTPException
import io
import json
import re
import sys
import unicodedata
from pathlib import Path
from urllib.error import HTTPError
from urllib.parse import urlencode
from urllib.request import HTTPRedirectHandler, Request, build_opener

ORIGINS = ("https://qmaps.ca", "https://www.qmaps.ca")
HEADER = (
    "id_qmaps_propose", "reference_municipale", "nom", "adresse_publique",
    "ville", "province", "categorie_qmaps", "source", "licence",
)
FIXED_COLUMNS = ("Montréal", "QC", "restaurants", "Ville de Montréal — Établissements alimentaires", "CC BY 4.0")
UUID = re.compile(r"[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}")
REFERENCE = re.compile(r"[1-9][0-9]{0,19}")
BATCH = re.compile(r"mtl-[0-9]{4}-[0-9]{2}-[0-9]{2}-[a-z0-9][a-z0-9-]{0,31}")
CURSOR = re.compile(r"[A-Za-z0-9_-]{1,512}")
PAGE_SIZE = 24
CSV_LIMIT = 131072
JSON_LIMIT = 2 * 1024 * 1024


class VerificationError(ValueError):
    """An actionable, redacted verification failure."""


@dataclass(frozen=True)
class PilotRow:
    id: str
    reference: str
    name: str
    address: str


def read_manifest(path):
    try:
        with Path(path).open("rb") as manifest:
            raw = manifest.read(CSV_LIMIT + 1)
        if not raw or len(raw) > CSV_LIMIT:
            raise VerificationError("Taille du manifeste invalide.")
        records = csv.reader(io.StringIO(raw.decode("utf-8-sig"), newline=""), strict=True)
        if tuple(next(records, ())) != HEADER:
            raise VerificationError("En-tête du manifeste invalide.")
        entries, ids, references = [], set(), set()
        for row in records:
            if len(row) != len(HEADER) or len(entries) == 24:
                raise VerificationError("Le manifeste doit contenir de 1 à 24 fiches valides.")
            identifier, reference, name, address = row[:4]
            if (
                not UUID.fullmatch(identifier) or not REFERENCE.fullmatch(reference)
                or not name.strip() or not address.strip() or tuple(row[4:]) != FIXED_COLUMNS
            ):
                raise VerificationError("Identité, adresse ou provenance invalide dans le manifeste.")
            if identifier in ids or reference in references:
                raise VerificationError("Identifiant ou référence répété dans le manifeste.")
            ids.add(identifier)
            references.add(reference)
            entries.append(PilotRow(identifier, reference, name, address))
        if not entries:
            raise VerificationError("Le manifeste ne contient aucune fiche.")
    except (OSError, UnicodeError, csv.Error):
        raise VerificationError("Impossible de lire le manifeste CSV UTF-8.") from None
    return entries, hashlib.sha256(raw).hexdigest()


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def read_json(url, expected_status):
    # No cookie jar, Authorization or redirects. Only fixed-origin GETs from CLI.
    request = Request(url, headers={"Accept": "application/json", "Cache-Control": "no-cache"}, method="GET")
    try:
        try:
            response = build_opener(NoRedirect()).open(request, timeout=10)
        except HTTPError as error:
            response = error
        with response:
            if response.status != expected_status or response.headers.get_content_type() != "application/json":
                raise VerificationError(f"HTTP {response.status}. Attendu HTTP {expected_status} JSON sans redirection.")
            body = response.read(JSON_LIMIT + 1)
    except (OSError, HTTPException):
        raise VerificationError("La lecture HTTP a échoué ou expiré.") from None
    if len(body) > JSON_LIMIT:
        raise VerificationError("La réponse JSON dépasse la taille autorisée.")
    try:
        value = json.loads(body)
    except (ValueError, UnicodeError):
        raise VerificationError("La réponse n’est pas un JSON valide.") from None
    if not isinstance(value, dict):
        raise VerificationError("La réponse JSON n’est pas un objet.")
    return value


def request_json(url, status, request, context):
    try:
        body = request(url, status)
    except VerificationError as error:
        raise VerificationError(f"{context} — {error}") from None
    except (OSError, ValueError):
        raise VerificationError(f"{context} — la lecture a échoué.") from None
    if not isinstance(body, dict):
        raise VerificationError(f"{context} — la réponse JSON n’est pas un objet.")
    return body


def marker(row):
    attributes = row.get("attributes")
    provenance = attributes.get("qmaps_directory_import") if isinstance(attributes, dict) else None
    return provenance if isinstance(provenance, dict) else {}


def is_montreal(city):
    if not isinstance(city, str):
        return False
    deaccented = "".join(c for c in unicodedata.normalize("NFD", city) if not unicodedata.combining(c))
    return deaccented.strip().casefold() == "montreal"


def matches_row(row, entry, batch):
    expected = {
        "id": entry.id, "name": entry.name, "address": entry.address, "city": "Montréal",
        "latitude": None, "longitude": None, "hours_json": None,
    }
    provenance = {"source": "mtl_food", "external_id": entry.reference, "licence": "CC-BY-4.0", "cohort": batch}
    actual = marker(row)
    return (
        all(key in row and row[key] == value for key, value in expected.items())
        and all(actual.get(key) == value for key, value in provenance.items())
    )


def has_restaurant_category(row):
    links = row.get("business_categories")
    if not isinstance(links, list):
        return False
    return any(isinstance(link, dict) and isinstance(link.get("categories"), dict)
               and link["categories"].get("slug") == "restaurants" for link in links)


def verify_host(origin, entries, batch, state, request=read_json, max_pages=100):
    if state not in ("published", "absent") or not BATCH.fullmatch(batch):
        raise VerificationError("État ou identifiant du lot invalide.")
    expected = {entry.id: entry for entry in entries}
    if not expected or len(expected) != len(entries):
        raise VerificationError("Les fiches attendues doivent avoir des identifiants distincts.")
    base = origin + "/api/v1/browser/"
    filters = {"city": "Montréal", "category": "restaurants", "sort": "recommended", "limit": str(PAGE_SIZE)}
    seen_ids, seen_cursors, found = set(), set(), set()
    # Require the current paginated route even when verifying absence. A 404
    # on an old backend must never be mistaken for a proof of withdrawal.
    for page_no in range(1, max_pages + 1):
        context = f"Page {page_no} de l’annuaire paginé"
        body = request_json(base + "directory/results?" + urlencode(filters), 200, request, context)
        items, cursor = body.get("items"), body.get("next")
        if not isinstance(items, list) or len(items) > PAGE_SIZE or "next" not in body:
            raise VerificationError("Page de l’annuaire invalide.")
        for row in items:
            identifier = row.get("id") if isinstance(row, dict) else None
            if not isinstance(identifier, str) or not UUID.fullmatch(identifier) or not is_montreal(row.get("city")):
                raise VerificationError("Fiche ou ville invalide dans la page.")
            if identifier in seen_ids:
                raise VerificationError("Identifiant répété dans les résultats paginés.")
            seen_ids.add(identifier)
            if identifier in expected:
                if state == "absent":
                    raise VerificationError("Une fiche du manifeste apparaît encore dans les résultats.")
                if (
                    not matches_row(row, expected[identifier], batch) or not has_restaurant_category(row)
                    or row.get("is_claimed") is not False or row.get("is_open") is not False
                    or any(key not in row or row[key] is not None for key in ("phone", "website", "hours"))
                ):
                    raise VerificationError("Les champs ou le crédit d’une fiche du lot ne concordent pas dans la recherche.")
                found.add(identifier)
            elif marker(row).get("cohort") == batch:
                raise VerificationError("Le lot contient une fiche inattendue dans les résultats.")
        if cursor is None:
            break
        if not isinstance(cursor, str) or not CURSOR.fullmatch(cursor) or len(items) != PAGE_SIZE:
            raise VerificationError("Curseur ou taille de page invalide.")
        if cursor in seen_cursors:
            raise VerificationError("Le curseur des résultats se répète.")
        seen_cursors.add(cursor)
        filters["after"] = cursor
    else:
        raise VerificationError("Vérification incomplète. Limite de pages atteinte.")

    if state == "published" and found != set(expected):
        raise VerificationError(f"{len(expected) - len(found)} fiche(s) du lot manquante(s) dans les résultats.")
    for number, entry in enumerate(entries, start=1):
        context = f"Détail {number}/{len(entries)}"
        detail = request_json(base + "places/" + entry.id, 200 if state == "published" else 404, request, context)
        if state == "published" and not matches_row(detail, entry, batch):
            raise VerificationError(f"{context} — identité, adresse ou crédit municipal divergent.")
        if state == "absent" and detail.get("error") != "Introuvable":
            raise VerificationError(f"{context} — le JSON ne confirme pas l’absence de la fiche.")
    return {"origin": origin, "pages": page_no, "catalogue_ids": len(seen_ids),
            "cohort_matches": len(found), "details_checked": len(entries)}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--batch", required=True)
    parser.add_argument("--state", required=True, choices=("published", "absent"))
    parser.add_argument("manifest", type=Path)
    args = parser.parse_args(argv)
    try:
        if not BATCH.fullmatch(args.batch):
            raise VerificationError("Identifiant du lot invalide.")
        entries, sha256 = read_manifest(args.manifest)
    except VerificationError as error:
        print(error, file=sys.stderr)
        return 2

    results, failures = [], []
    for origin in ORIGINS:
        try:
            results.append(verify_host(origin, entries, args.batch, args.state))
        except VerificationError as error:
            failures.append({"origin": origin, "error": str(error)})
    print(json.dumps({
        "batch": args.batch, "expected_state": args.state, "manifest_file_sha256": sha256,
        "expected_members": len(entries), "passed": not failures, "results": results, "failures": failures,
    }, ensure_ascii=False))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
