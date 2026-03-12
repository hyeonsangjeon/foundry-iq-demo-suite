"""
NASA 인덱스 image_url 업데이트 스크립트
- 각 chunk의 텍스트 내용을 키워드 매칭하여 주제별 이미지 할당
- 기존 earth_lights_lrg.jpg 단일 매핑을 6개 주제별 이미지로 분산
- image_url 필드 + chunk 텍스트 내부 [IMAGE_URL: ...] 모두 업데이트
"""
import json
import os
import re
import urllib.request
import urllib.error

# Load .env.local (dotenv fallback: manual parse if dotenv not installed)
def load_env_local():
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env.local")
    env_path = os.path.abspath(env_path)
    if not os.path.exists(env_path):
        raise FileNotFoundError(f".env.local not found at {env_path}")
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key not in os.environ:
                os.environ[key] = value

load_env_local()

ENDPOINT = os.environ["AZURE_SEARCH_ENDPOINT"].rstrip("/")
API_KEY  = os.environ["AZURE_SEARCH_API_KEY"]
API_VER  = "2025-11-01-preview"
INDEX    = "nasa-earth-book-index"

# ── SAS URL mapping (generated 2026-03-12, expiry 2030-01-01) ──
IMAGE_URLS = {
    "night":         "https://stfoundryiqdemo2.blob.core.windows.net/nasa-images/earth_lights_lrg.jpg?se=2030-01-01T00%3A00%3A00Z&sp=r&spr=https&sv=2026-02-06&sr=b&sig=Quw81D382gAovdVL083CZA%2FH5GEnUJlPG2GHnDtBE3Y%3D",
    "ocean":         "https://stfoundryiqdemo2.blob.core.windows.net/nasa-images/ocean-temperature-sst.jpg?se=2030-01-01T00%3A00%3A00Z&sp=r&spr=https&sv=2026-02-06&sr=b&sig=enJQDzJFlUyZwesQbE5FUIzKP0P4Y6fVn%2BxlyAYbWQw%3D",
    "satellite":     "https://stfoundryiqdemo2.blob.core.windows.net/nasa-images/blue-marble-viirs.jpg?se=2030-01-01T00%3A00%3A00Z&sp=r&spr=https&sv=2026-02-06&sr=b&sig=j%2FgTdpfgf%2Fu1jl4a9YqvYnS07AH7nB35ceBW091sRtc%3D",
    "deforestation": "https://stfoundryiqdemo2.blob.core.windows.net/nasa-images/deforestation-rondonia.jpg?se=2030-01-01T00%3A00%3A00Z&sp=r&spr=https&sv=2026-02-06&sr=b&sig=0CfRSgfFdf1NVkf6CXjSWAVLQJZjP9wbO4KRmlY9Y18%3D",
    "ice":           "https://stfoundryiqdemo2.blob.core.windows.net/nasa-images/arctic-sea-ice-greenland.jpg?se=2030-01-01T00%3A00%3A00Z&sp=r&spr=https&sv=2026-02-06&sr=b&sig=R5esduzYOu2tpUX2XZwbkFnQx%2FI3wqIZbWqcw09F%2BKc%3D",
    "weather":       "https://stfoundryiqdemo2.blob.core.windows.net/nasa-images/hurricane-juliette-terra.jpg?se=2030-01-01T00%3A00%3A00Z&sp=r&spr=https&sv=2026-02-06&sr=b&sig=YX2UDaWErEYiy3VPtLT6fp70V%2FrFX0BKzGTPPYmHURI%3D",
}

# ── keyword → topic classification ──
TOPIC_KEYWORDS = {
    "night":         ["night", "city lights", "illumination", "day-night band", "nighttime", "viirs night",
                      "lights at night", "artificial light", "electric light"],
    "ocean":         ["ocean temperature", "sea surface temperature", "sst", "thermal", "ocean warm",
                      "ocean heat", "sea surface", "ocean color", "phytoplankton", "sea level",
                      "ocean current", "salinity"],
    "satellite":     ["satellite", "suomi npp", "viirs", "orbit", "radiometer", "blue marble",
                      "instrument", "sensor", "spacecraft", "launch", "moderate resolution",
                      "modis", "landsat"],
    "deforestation": ["deforestation", "forest", "amazon", "rondonia", "logging", "tree cover",
                      "land use", "land cover", "deforestation rate", "tropical forest",
                      "vegetation", "forest loss", "rainforest"],
    "ice":           ["ice", "arctic", "antarctic", "glacier", "sea ice", "polar", "ice sheet",
                      "ice loss", "permafrost", "greenland", "ice cap", "cryosphere",
                      "freeze", "thaw", "ice extent"],
    "weather":       ["weather", "hurricane", "typhoon", "storm", "precipitation", "cyclone",
                      "forecast", "rainfall", "atmospheric", "cloud", "wind", "flood",
                      "climate model", "temperature anomaly"],
}


def classify_chunk(text: str) -> str | None:
    """Return the best-matching topic for a chunk of text, or None if no keywords match."""
    text_lower = text.lower()
    scores = {}
    for topic, keywords in TOPIC_KEYWORDS.items():
        scores[topic] = sum(1 for kw in keywords if kw.lower() in text_lower)
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else None


def replace_image_url_in_chunk(chunk_text: str, new_url: str) -> str:
    """Replace [IMAGE_URL: old_url] in chunk text with [IMAGE_URL: new_url]."""
    return re.sub(
        r'\[IMAGE_URL:\s*[^\]]+\]',
        f'[IMAGE_URL: {new_url}]',
        chunk_text,
    )


def search_all_docs() -> list[dict]:
    """Retrieve all documents from the index (chunk_id + chunk text)."""
    url = f"{ENDPOINT}/indexes/{INDEX}/docs/search?api-version={API_VER}"
    body = {"search": "*", "top": 1000, "select": "chunk_id,chunk"}
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        url, data,
        {"Content-Type": "application/json", "api-key": API_KEY},
        method="POST",
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())["value"]


def update_docs(updates: list[dict]) -> dict:
    """Merge-update image_url and chunk text on a batch of documents."""
    url = f"{ENDPOINT}/indexes/{INDEX}/docs/index?api-version={API_VER}"
    actions = []
    for u in updates:
        action = {
            "@search.action": "merge",
            "chunk_id": u["chunk_id"],
            "image_url": u["image_url"],
        }
        if "chunk" in u:
            action["chunk"] = u["chunk"]
        actions.append(action)
    body = {"value": actions}
    data = json.dumps(body).encode()
    req = urllib.request.Request(
        url, data,
        {"Content-Type": "application/json", "api-key": API_KEY},
        method="POST",
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())


if __name__ == "__main__":
    print(f"Index: {INDEX}")
    print(f"Endpoint: {ENDPOINT}\n")

    docs = search_all_docs()
    print(f"Total docs fetched: {len(docs)}")

    updates = []
    stats = {}

    chunk_text_updated = 0
    for doc in docs:
        chunk_text = doc.get("chunk", "")
        topic = classify_chunk(chunk_text)
        if topic:
            image_url = IMAGE_URLS[topic]
            stats[topic] = stats.get(topic, 0) + 1
        else:
            # Fall back to "night" (earth_lights) for unclassified chunks
            image_url = IMAGE_URLS["night"]
            stats["fallback_to_night"] = stats.get("fallback_to_night", 0) + 1

        update = {"chunk_id": doc["chunk_id"], "image_url": image_url}

        # Also fix [IMAGE_URL: ...] embedded in chunk text
        if "[IMAGE_URL:" in chunk_text:
            new_chunk = replace_image_url_in_chunk(chunk_text, image_url)
            if new_chunk != chunk_text:
                update["chunk"] = new_chunk
                chunk_text_updated += 1

        updates.append(update)

    print(f"\nChunks with [IMAGE_URL:] in text updated: {chunk_text_updated}")
    print("\nClassification Results:")
    for topic, count in sorted(stats.items()):
        print(f"  {topic}: {count} chunks")

    # Batch update (Azure Search limit: 1000 docs per request)
    BATCH_SIZE = 100
    total_batches = (len(updates) + BATCH_SIZE - 1) // BATCH_SIZE
    print(f"\nUpdating {len(updates)} docs in {total_batches} batch(es)...")

    updated_count = 0
    for i in range(0, len(updates), BATCH_SIZE):
        batch = updates[i : i + BATCH_SIZE]
        result = update_docs(batch)
        succeeded = sum(1 for r in result.get("value", []) if r.get("status"))
        updated_count += succeeded
        print(f"  Batch {i // BATCH_SIZE + 1}/{total_batches}: {succeeded}/{len(batch)} succeeded")

    print(f"\nDone. {updated_count}/{len(updates)} documents updated with topic-specific image URLs.")
