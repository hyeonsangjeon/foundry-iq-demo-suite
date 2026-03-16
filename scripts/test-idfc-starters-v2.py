#!/usr/bin/env python3
"""Test 6 IDFC starters with array content format"""
import json, os, urllib.request, urllib.error
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env.local"))

E = os.environ["AZURE_SEARCH_ENDPOINT"].rstrip("/")
K = os.environ["AZURE_SEARCH_API_KEY"]
VER = "2025-11-01-preview"

queries = [
    ("idfc-retail-deposit", "What drove the increase in IDFC First Bank retail deposit share in FY25?"),
    ("idfc-nim-casa", "Summarize key changes in NIM, CASA ratio, and asset quality from Q3 FY26."),
    ("idfc-branches", "How many branches does IDFC First Bank operate, and what is the expansion strategy?"),
    ("idfc-rbi-auth", "What must banks implement before April 1, 2026 under RBI digital payment authentication directions?"),
    ("idfc-fintech", "What are the mandatory controls for fintech lending service provider partnerships per RBI 2025?"),
    ("idfc-cross", "How should IDFC align its digital strategy with RBI evolving authentication and lending regulations?"),
]

ok = 0
for i, (sid, q) in enumerate(queries, 1):
    print(f"[{i}/6] {q[:70]}...")
    url = f"{E}/knowledgebases/idfc-banking-kb/retrieve?api-version={VER}"
    body = json.dumps({"messages": [{"role": "user", "content": [{"type": "text", "text": q}]}]}).encode()
    req = urllib.request.Request(url, body, {"Content-Type": "application/json", "api-key": K}, method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            d = json.loads(r.read())
        resp = d.get("response", [])
        refs = d.get("references", [])
        text = ""
        if resp:
            for c in resp[0].get("content", []):
                if c.get("type") == "text":
                    text = c["text"][:120]
        print(f"  OK | refs={len(refs)} | {text}...")
        ok += 1
    except urllib.error.HTTPError as e:
        print(f"  FAIL {e.code}: {e.read().decode()[:150]}")
    print()

print(f"Result: {ok}/6 OK")
