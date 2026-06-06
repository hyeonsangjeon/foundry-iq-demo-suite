#!/usr/bin/env python3
"""
Live Foundry IQ smoke test.

Creates a temporary Search index Knowledge Source and Knowledge Base, optionally
runs retrieve, then deletes both resources in a finally block.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

import foundry_iq_easy_setup as helper  # noqa: E402


def safe_error(exc: BaseException) -> str:
    return str(exc).replace("\n", " ")[:500]


def print_json(data: Any) -> None:
    print(json.dumps(data, indent=2, ensure_ascii=False))


def first_index(version: str) -> str:
    data = helper.request("GET", "/indexes", version)
    indexes = data.get("value", []) if isinstance(data, dict) else []
    if not indexes:
        raise SystemExit("No Azure AI Search indexes found. Provide --index-name after creating an index.")
    return indexes[0]["name"]


def delete_quiet(kind: str, name: str, path: str, version: str) -> dict[str, str]:
    try:
        helper.request("DELETE", path, version)
        return {"kind": kind, "name": name, "status": "deleted"}
    except SystemExit as exc:
        text = safe_error(exc)
        if '"status": 404' in text:
            return {"kind": kind, "name": name, "status": "already-missing"}
        return {"kind": kind, "name": name, "status": "delete-failed", "error": text}


def require_model_env() -> None:
    endpoint = os.environ.get("NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT", "").strip()
    if not endpoint or helper.is_placeholder(endpoint):
        raise SystemExit("NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT is required for live KB creation.")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Create and delete temporary Foundry IQ KS/KB resources.")
    parser.add_argument("--env-file", default=str(helper.DEFAULT_ENV))
    parser.add_argument("--index-name", help="Existing Azure AI Search index to use. Defaults to the first index.")
    parser.add_argument("--model", help="Azure OpenAI deployment. Defaults to AZURE_OPENAI_DEPLOYMENT or gpt-4o.")
    parser.add_argument("--api-version", default=os.environ.get("AZURE_SEARCH_API_VERSION", helper.DEFAULT_API_VERSION))
    parser.add_argument("--auth-mode", choices=["auto", "api-key", "rbac"], default="auto")
    parser.add_argument("--prefix", default="codex-it")
    parser.add_argument("--skip-retrieve", action="store_true")
    parser.add_argument("--max-runtime", type=int, default=60)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    helper.load_env(Path(args.env_file))
    if args.auth_mode == "api-key":
        os.environ["AZURE_SEARCH_USE_RBAC"] = "false"
    elif args.auth_mode == "rbac":
        os.environ["AZURE_SEARCH_USE_RBAC"] = "true"

    require_model_env()
    model = args.model or os.environ.get("AZURE_OPENAI_DEPLOYMENT") or "gpt-4o"
    if helper.is_placeholder(model):
        model = "gpt-4o"

    suffix = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
    base_name = f"{args.prefix}-{suffix}".lower()
    ks_name = f"{base_name}-ks"
    kb_name = f"{base_name}-kb"
    version = args.api_version

    result: dict[str, Any] = {
        "test": "foundry-iq-live-smoke",
        "knowledgeSource": ks_name,
        "knowledgeBase": kb_name,
        "authMode": args.auth_mode,
        "steps": [],
        "cleanup": [],
    }

    try:
        index_name = args.index_name or first_index(version)
        result["steps"].append({"name": "select-index", "status": "ok"})

        ks_body = {
            "name": ks_name,
            "kind": "searchIndex",
            "description": "Temporary live smoke test knowledge source.",
            "searchIndexParameters": {"searchIndexName": index_name},
        }
        helper.request("PUT", f"/knowledgesources/{ks_name}", version, ks_body)
        result["steps"].append({"name": "create-knowledge-source", "status": "ok"})

        kb_body = {
            "name": kb_name,
            "description": "Temporary live smoke test knowledge base.",
            "models": [
                {
                    "kind": "azureOpenAI",
                    "azureOpenAIParameters": helper.model_parameters(model),
                }
            ],
            "knowledgeSources": [{"name": ks_name}],
            "retrievalReasoningEffort": {"kind": "low"},
            "outputMode": "answerSynthesis",
        }
        helper.request("PUT", f"/knowledgebases/{kb_name}", version, kb_body)
        result["steps"].append({"name": "create-knowledge-base", "status": "ok"})

        if not args.skip_retrieve:
            retrieve_body = {
                "messages": [
                    {
                        "role": "user",
                        "content": [{"type": "text", "text": "What information is available?"}],
                    }
                ],
                "maxRuntimeInSeconds": args.max_runtime,
            }
            helper.request("POST", f"/knowledgebases/{kb_name}/retrieve", version, retrieve_body)
            result["steps"].append({"name": "retrieve", "status": "ok"})

    except SystemExit as exc:
        result["steps"].append({"name": "live-smoke", "status": "failed", "error": safe_error(exc)})
        raise
    finally:
        result["cleanup"].append(
            delete_quiet("knowledgeBase", kb_name, f"/knowledgebases/{kb_name}", version)
        )
        result["cleanup"].append(
            delete_quiet("knowledgeSource", ks_name, f"/knowledgesources/{ks_name}", version)
        )
        print_json(result)


if __name__ == "__main__":
    main()
