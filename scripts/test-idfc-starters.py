#!/usr/bin/env python3
"""Test 6 IDFC Banking KB starter queries"""
import json, os, urllib.request
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env.local"))

ENDPOINT = os.environ["AZURE_SEARCH_ENDPOINT"].rstrip("/")
KEY = os.environ["AZURE_SEARCH_API_KEY"]
VER = "2025-11-01-preview"

queries = [
    ("idfc-retail-deposit", "What drove the increase in IDFC First Bank retail deposit share in FY25?"),
    ("idfc-nim-casa", "Summarize key changes in NIM, CASA ratio, and asset quality from Q3 FY26."),
    ("idfc-branches", "How many branches does IDFC First Bank operate, and what is the expansion strategy?"),
    ("idfc-rbi-auth", "What must banks implement before April 1, 2026 under RBI digital payment authentication directions?"),
    ("idfc-fintech", "What are the mandatory controls for fintech lending service provider partnerships per RBI 2025?"),
    ("idfc-cross", "How should IDFC align its digital strategy with RBI evolving authentication and lending regulations?"),
]

results = []
for i, (sid, q) in enumerate(queries, 1):
    print(f"\n[{i}/6] {q[:75]}...")
    url = f"{ENDPOINT}/knowledgebases/idfc-banking-kb/retrieve?api-version={VER}"
    body = json.dumps({"messages": [{"role": "user", "content": q}]}).encode()
    req = urllib.request.Request(url, body, {"Content-Type": "application/json", "api-key": KEY}, method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            data = json.loads(r.read())
        resp = data.get("response", [])
        refs = data.get("references", [])
        if resp:
            text = ""
            for c in resp[0].get("content", []):
                if c.get("type") == "text":
                    text = c.get("text", "")[:200]
            ref_titles = list(set(r.get("sourceData", {}).get("title", "?") for r in refs))
            print(f"  OK | refs={len(refs)} | sources={ref_titles}")
            print(f"  Answer: {text}...")
            results.append((sid, "OK", len(refs)))
        else:
            print(f"  EMPTY RESPONSE")
            results.append((sid, "EMPTY", 0))
    except Exception as e:
        print(f"  ERROR: {e}")
        results.append((sid, f"ERROR: {e}", 0))

print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
ok = sum(1 for _, s, _ in results if s == "OK")
print(f"{ok}/6 queries successful\n")
for sid, status, refs in results:
    icon = "OK" if status == "OK" else "FAIL"
    print(f"  [{icon}] {sid}: {status} (refs={refs})")
