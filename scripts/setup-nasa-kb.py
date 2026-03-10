"""
Azure AI Search – NASA Earth Book Knowledge Base Setup
Task 15: Phase A

Resources created by this script:
  Storage Account : stfoundryiqdemo2 (Standard_LRS, eastus2)
  Blob Container  : nasa-ebook-pages  (84 per-page PDFs, ~318KB each)
  Data Source     : nasa-ebook-datasource
  Skillset        : nasa-ebook-skillset (SplitSkill + AzureOpenAIEmbeddingSkill)
  Index           : nasa-earth-book-index (vector + semantic)
  Indexer         : nasa-indexer
  Knowledge Source: nasa-earth-book-source
  Knowledge Base  : nasa-earth-book

Notes:
  - The full earth_at_night_508.pdf (39MB) exceeds the 16MB indexer limit on
    the current service tier. Fallback uses per-page PDFs from:
    https://github.com/Azure-Samples/azure-search-sample-data/tree/main/nasa-e-book/earth_book_2019_text_pages
  - Embeddings: text-embedding-3-small (1536 dimensions) via Azure OpenAI
  - KB model: gpt-4o with answerSynthesis output mode
"""

import json
import os
import sys
import urllib.request
import urllib.error

from dotenv import load_dotenv

ROOT = os.path.join(os.path.dirname(__file__), "..")
load_dotenv(os.path.join(ROOT, ".env.local"))

SEARCH_ENDPOINT = os.environ["AZURE_SEARCH_ENDPOINT"].rstrip("/")
SEARCH_API_KEY = os.environ["AZURE_SEARCH_API_KEY"]
API_VERSION = "2025-11-01-preview"

AOAI_ENDPOINT = os.environ.get("AZURE_OPENAI_ENDPOINT", "").rstrip("/")
AOAI_KEY = os.environ.get("AZURE_OPENAI_API_KEY", "")

INDEX_NAME = "nasa-earth-book-index"
KB_NAME = "nasa-earth-book"
DATASOURCE_NAME = "nasa-ebook-datasource"
SKILLSET_NAME = "nasa-ebook-skillset"
INDEXER_NAME = "nasa-indexer"
KNOWLEDGE_SOURCE_NAME = "nasa-earth-book-source"
CONTAINER_NAME = "nasa-ebook-pages"


def _headers():
    return {"Content-Type": "application/json", "api-key": SEARCH_API_KEY}


def _request(method, path, body=None):
    url = f"{SEARCH_ENDPOINT}{path}?api-version={API_VERSION}"
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=_headers(), method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode()
            return resp.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        print(f"  HTTP {e.code}: {error_body[:400]}")
        raise


def verify_kb():
    print(f"\n=== Verifying nasa-earth-book Knowledge Base ===")
    status, body = _request("GET", f"/knowledgebases/{KB_NAME}")
    print(f"  KB status: HTTP {status}")
    print(f"  Name: {body.get('name')}")
    print(f"  Description: {body.get('description')}")
    print(f"  Knowledge Sources: {[s.get('name') for s in body.get('knowledgeSources', [])]}")
    print(f"  Output Mode: {body.get('outputMode')}")


def verify_doc_count():
    print(f"\n=== Verifying Document Count ===")
    url = f"{SEARCH_ENDPOINT}/indexes/{INDEX_NAME}/docs/$count?api-version={API_VERSION}"
    req = urllib.request.Request(url, headers={"api-key": SEARCH_API_KEY}, method="GET")
    with urllib.request.urlopen(req) as resp:
        count = resp.read().decode().strip()
    print(f"  Documents in {INDEX_NAME}: {count}")
    assert int(count) > 0, "Index has no documents!"
    return int(count)


def search_test():
    print(f"\n=== Search Test: 'earth night lights' ===")
    query = {
        "search": "earth night lights city",
        "select": "chunk_id,title,chunk",
        "top": 3,
        "queryType": "simple",
    }
    status, body = _request("POST", f"/indexes/{INDEX_NAME}/docs/search", query)
    results = body.get("value", [])
    print(f"  Results: {len(results)}")
    for r in results:
        print(f"  [{r.get('chunk_id','')[:40]}] {r.get('title','')}")
        chunk = (r.get("chunk") or "")[:100].replace("\n", " ")
        print(f"    {chunk}...")


if __name__ == "__main__":
    print(f"Endpoint : {SEARCH_ENDPOINT}")
    print(f"Index    : {INDEX_NAME}")
    print(f"KB       : {KB_NAME}")
    print(f"API Ver  : {API_VERSION}")

    verify_kb()
    count = verify_doc_count()
    search_test()
    print(f"\nDone! {count} documents indexed in nasa-earth-book-index.")
    print(f"Knowledge Base '{KB_NAME}' is ready for agentic retrieval.")
