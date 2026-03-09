"""
Azure AI Search – Hotels Sample Index Setup
Reads concatenated JSON objects from tasks/dev/hotel.json (not a JSON array),
creates a search index with semantic config, bulk-uploads, and runs a test query.
"""

import json
import os
import sys
import urllib.request
import urllib.error

from dotenv import load_dotenv

# ── Config ───────────────────────────────────────────────────────────────────
ROOT = os.path.join(os.path.dirname(__file__), "..")
load_dotenv(os.path.join(ROOT, ".env.local"))

ENDPOINT = os.environ["AZURE_SEARCH_ENDPOINT"].rstrip("/")
API_KEY = os.environ["AZURE_SEARCH_API_KEY"]
API_VERSION = "2025-11-01-preview"
INDEX_NAME = "hotels-sample"
DATA_PATH = os.path.join(ROOT, "tasks", "dev", "hotel.json")


# ── Helpers ──────────────────────────────────────────────────────────────────
def _headers():
    return {"Content-Type": "application/json", "api-key": API_KEY}


def _request(method, path, body=None):
    url = f"{ENDPOINT}{path}?api-version={API_VERSION}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=_headers(), method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status, json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"  HTTP {e.code}: {error_body}")
        raise


def parse_concatenated_json(filepath):
    """Parse a file containing concatenated JSON objects (not a JSON array)."""
    with open(filepath, encoding="utf-8-sig") as f:
        text = f.read()

    decoder = json.JSONDecoder()
    objects = []
    idx = 0
    while idx < len(text):
        # skip whitespace and commas between objects
        while idx < len(text) and text[idx] in " \t\r\n,":
            idx += 1
        if idx >= len(text):
            break
        obj, end = decoder.raw_decode(text, idx)
        objects.append(obj)
        idx = end
    return objects


# ── 1. Load local data ──────────────────────────────────────────────────────
def load_hotels():
    print(f"1) Loading hotels from {DATA_PATH} …")
    hotels = parse_concatenated_json(DATA_PATH)
    print(f"   Parsed {len(hotels)} hotel objects")
    return hotels


# ── 2. Create index ─────────────────────────────────────────────────────────
INDEX_DEF = {
    "name": INDEX_NAME,
    "fields": [
        {"name": "HotelId", "type": "Edm.String", "key": True, "filterable": True},
        {"name": "HotelName", "type": "Edm.String", "searchable": True, "filterable": True, "sortable": True},
        {"name": "Description", "type": "Edm.String", "searchable": True},
        {"name": "Description_fr", "type": "Edm.String", "searchable": True, "analyzer": "fr.lucene"},
        {"name": "Category", "type": "Edm.String", "searchable": True, "filterable": True, "facetable": True, "sortable": True},
        {"name": "Tags", "type": "Collection(Edm.String)", "searchable": True, "filterable": True, "facetable": True},
        {"name": "ParkingIncluded", "type": "Edm.Boolean", "filterable": True, "facetable": True},
        {"name": "LastRenovationDate", "type": "Edm.DateTimeOffset", "filterable": True, "sortable": True},
        {"name": "Rating", "type": "Edm.Double", "filterable": True, "sortable": True, "facetable": True},
        {
            "name": "Address",
            "type": "Edm.ComplexType",
            "fields": [
                {"name": "StreetAddress", "type": "Edm.String", "searchable": True},
                {"name": "City", "type": "Edm.String", "searchable": True, "filterable": True, "sortable": True, "facetable": True},
                {"name": "StateProvince", "type": "Edm.String", "searchable": True, "filterable": True, "sortable": True, "facetable": True},
                {"name": "PostalCode", "type": "Edm.String", "searchable": True, "filterable": True, "sortable": True, "facetable": True},
                {"name": "Country", "type": "Edm.String", "searchable": True, "filterable": True, "sortable": True, "facetable": True},
            ],
        },
        {"name": "Location", "type": "Edm.GeographyPoint", "filterable": True, "sortable": True},
        {
            "name": "Rooms",
            "type": "Collection(Edm.ComplexType)",
            "fields": [
                {"name": "Description", "type": "Edm.String", "searchable": True},
                {"name": "Description_fr", "type": "Edm.String", "searchable": True, "analyzer": "fr.lucene"},
                {"name": "Type", "type": "Edm.String", "searchable": True, "filterable": True, "facetable": True},
                {"name": "BaseRate", "type": "Edm.Double", "filterable": True, "facetable": True},
                {"name": "BedOptions", "type": "Edm.String", "searchable": True},
                {"name": "SleepsCount", "type": "Edm.Int32", "filterable": True, "facetable": True},
                {"name": "SmokingAllowed", "type": "Edm.Boolean", "filterable": True, "facetable": True},
                {"name": "Tags", "type": "Collection(Edm.String)", "searchable": True, "filterable": True, "facetable": True},
            ],
        },
    ],
    "semantic": {
        "configurations": [
            {
                "name": "hotels-semantic-config",
                "prioritizedFields": {
                    "titleField": {"fieldName": "HotelName"},
                    "prioritizedContentFields": [{"fieldName": "Description"}],
                    "prioritizedKeywordsFields": [{"fieldName": "Category"}, {"fieldName": "Tags"}],
                },
            }
        ]
    },
}


def create_index():
    print(f"2) Creating index '{INDEX_NAME}' …")
    # Delete if exists
    try:
        _request("DELETE", f"/indexes/{INDEX_NAME}")
        print("   Deleted existing index")
    except Exception:
        pass

    status, body = _request("PUT", f"/indexes/{INDEX_NAME}", INDEX_DEF)
    print(f"   Index created (HTTP {status})")


# ── 3. Upload documents ─────────────────────────────────────────────────────
def upload_documents(hotels):
    print(f"3) Uploading {len(hotels)} documents …")
    docs = []
    for h in hotels:
        doc = {k: v for k, v in h.items() if k != "IsDeleted"}
        doc["@search.action"] = "mergeOrUpload"
        docs.append(doc)

    status, body = _request("POST", f"/indexes/{INDEX_NAME}/docs/index", {"value": docs})
    ok = sum(1 for r in body.get("value", []) if r.get("statusCode") in (200, 201) or r.get("status"))
    print(f"   Uploaded {ok}/{len(docs)} documents (HTTP {status})")


# ── 4. Search test ───────────────────────────────────────────────────────────
def search_test():
    print("\n4) Search test: 'luxury hotel' …")
    query = {
        "search": "luxury hotel",
        "select": "HotelId,HotelName,Rating,Category,Description",
        "top": 5,
    }
    status, body = _request("POST", f"/indexes/{INDEX_NAME}/docs/search", query)
    results = body.get("value", [])
    print(f"   Found {len(results)} results:\n")
    for r in results:
        score = r.get("@search.score", 0)
        print(f"   [{r['HotelId']}] {r['HotelName']}  (Rating: {r.get('Rating', 'N/A')}, Score: {score:.4f})")
        print(f"       Category: {r.get('Category', 'N/A')}")
        desc = (r.get("Description") or "")[:120]
        print(f"       {desc}…\n")


# ── Main ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"Endpoint : {ENDPOINT}")
    print(f"Index    : {INDEX_NAME}")
    print(f"API Ver  : {API_VERSION}\n")

    hotels = load_hotels()
    create_index()
    upload_documents(hotels)
    search_test()
    print("Done!")
