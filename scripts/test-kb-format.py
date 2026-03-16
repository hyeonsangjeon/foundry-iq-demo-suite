#!/usr/bin/env python3
"""Compare KB retrieve formats: string vs array content"""
import json, os, urllib.request, urllib.error
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local"))

E = os.environ["AZURE_SEARCH_ENDPOINT"].rstrip("/")
K = os.environ["AZURE_SEARCH_API_KEY"]
VER = "2025-11-01-preview"

def test_kb(label, kb_name, body_dict):
    print(f"\n{label}")
    url = f"{E}/knowledgebases/{kb_name}/retrieve?api-version={VER}"
    body = json.dumps(body_dict).encode()
    req = urllib.request.Request(url, body, {"Content-Type": "application/json", "api-key": K}, method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            d = json.loads(r.read())
        resp = d.get("response", [])
        refs = d.get("references", [])
        if resp:
            for c in resp[0].get("content", []):
                if c.get("type") == "text":
                    print(f"  OK | refs={len(refs)} | answer: {c['text'][:150]}...")
                    return
        print(f"  EMPTY | refs={len(refs)}")
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code}: {e.read().decode()[:200]}")

# NASA KB — string content (known working)
test_kb("=== NASA KB + string content ===", "nasa-earth-book",
        {"messages": [{"role": "user", "content": "What is Earth at night?"}]})

# IDFC KB — string content
test_kb("=== IDFC KB + string content ===", "idfc-banking-kb",
        {"messages": [{"role": "user", "content": "What is CASA ratio?"}]})

# IDFC KB — array content
test_kb("=== IDFC KB + array content ===", "idfc-banking-kb",
        {"messages": [{"role": "user", "content": [{"type": "text", "text": "What is CASA ratio?"}]}]})

print("\nDone.")
