#!/usr/bin/env python3
"""
Foundry IQ easy setup helper.

This script intentionally accepts domain-level inputs and builds Azure AI Search
Knowledge Source / Knowledge Base REST payloads for you. It uses only the Python
standard library.
"""

from __future__ import annotations

import argparse
import json
import os
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_ENV = ROOT / ".env.local"
DEFAULT_API_VERSION = "2025-11-01-preview"
PREVIEW_API_VERSION = "2026-05-01-preview"
SECRET_FIELD_NAMES = {
    "apikey",
    "api_key",
    "authorization",
    "clientsecret",
    "client_secret",
    "connectionstring",
    "connection_string",
    "password",
    "secret",
    "token",
}


def load_env(path: Path = DEFAULT_ENV) -> None:
    if not path.exists():
        return

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip()
        if " #" in value:
            value = value.split(" #", 1)[0].strip()
        value = value.strip('"').strip("'")
        os.environ.setdefault(key, value)


def truthy(value: str | None) -> bool:
    return (value or "").strip().lower() in {"1", "true", "yes", "y", "on"}


def required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise SystemExit(f"Missing required environment variable: {name}")
    if is_placeholder(value):
        raise SystemExit(f"Environment variable {name} still contains a placeholder value")
    return value


def is_placeholder(value: str) -> bool:
    normalized = value.strip().lower()
    return (
        normalized.startswith("your-")
        or normalized.startswith("<")
        or "placeholder" in normalized
        or normalized in {"changeme", "change-me", "todo"}
    )


def search_endpoint() -> str:
    return required_env("AZURE_SEARCH_ENDPOINT").rstrip("/")


def api_version(args: argparse.Namespace, fallback: str = DEFAULT_API_VERSION) -> str:
    return getattr(args, "api_version", None) or os.environ.get("AZURE_SEARCH_API_VERSION") or fallback


def service_token() -> str:
    tenant_id = required_env("AZURE_TENANT_ID")
    client_id = required_env("AZURE_CLIENT_ID")
    client_secret = required_env("AZURE_CLIENT_SECRET")
    body = urllib.parse.urlencode(
        {
            "client_id": client_id,
            "client_secret": client_secret,
            "scope": "https://search.azure.com/.default",
            "grant_type": "client_credentials",
        }
    ).encode("utf-8")
    req = urllib.request.Request(
        f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token",
        data=body,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return data["access_token"]


def auth_headers() -> dict[str, str]:
    headers = {"Content-Type": "application/json"}
    if truthy(os.environ.get("AZURE_SEARCH_USE_RBAC")):
        headers["Authorization"] = f"Bearer {service_token()}"
    else:
        headers["api-key"] = required_env("AZURE_SEARCH_API_KEY")
    return headers


def request(
    method: str,
    path: str,
    version: str,
    body: dict[str, Any] | None = None,
    extra_headers: dict[str, str] | None = None,
) -> Any:
    separator = "&" if "?" in path else "?"
    url = f"{search_endpoint()}{path}{separator}api-version={version}"
    payload = json.dumps(body).encode("utf-8") if body is not None else None
    headers = auth_headers()
    if extra_headers:
        headers.update(extra_headers)

    req = urllib.request.Request(url, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read().decode("utf-8")
            if not raw:
                return {"status": resp.status, "ok": True}
            return json.loads(raw)
    except urllib.error.HTTPError as err:
        raw = err.read().decode("utf-8")
        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError:
            parsed = raw
        raise SystemExit(json.dumps({"status": err.code, "error": parsed}, indent=2, ensure_ascii=False))
    except urllib.error.URLError as err:
        raise SystemExit(
            json.dumps(
                {"status": "network-error", "error": str(err.reason)},
                indent=2,
                ensure_ascii=False,
            )
        )


def print_json(data: Any) -> None:
    print(json.dumps(data, indent=2, ensure_ascii=False))


def redact_secrets(value: Any) -> Any:
    if isinstance(value, dict):
        redacted = {}
        for key, child in value.items():
            key_normalized = key.replace("-", "").replace("_", "").lower()
            if key_normalized in SECRET_FIELD_NAMES:
                redacted[key] = "***redacted***"
            else:
                redacted[key] = redact_secrets(child)
        return redacted

    if isinstance(value, list):
        return [redact_secrets(item) for item in value]

    return value


def maybe_save_payload(args: argparse.Namespace, payload: dict[str, Any]) -> None:
    save_path = getattr(args, "save_payload", None)
    if not save_path:
        return

    path = Path(save_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(redact_secrets(payload), indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def emit_or_request(
    args: argparse.Namespace,
    method: str,
    path: str,
    version: str,
    body: dict[str, Any],
    extra_headers: dict[str, str] | None = None,
) -> None:
    maybe_save_payload(args, body)

    if getattr(args, "dry_run", False):
        print_json(
            {
                "dryRun": True,
                "method": method,
                "path": path,
                "apiVersion": version,
                "body": redact_secrets(body),
                "extraHeaders": redact_secrets(extra_headers or {}),
            }
        )
        return

    print_json(request(method, path, version, body, extra_headers))


def default_ks_name(domain: str, suffix: str) -> str:
    safe = domain.strip().lower().replace("_", "-").replace(" ", "-")
    return f"{safe}-{suffix}"


def check(_: argparse.Namespace) -> None:
    keys = [
        "AZURE_SEARCH_ENDPOINT",
        "AZURE_SEARCH_API_KEY",
        "AZURE_SEARCH_API_VERSION",
        "AZURE_SEARCH_USE_RBAC",
        "AZURE_TENANT_ID",
        "AZURE_CLIENT_ID",
        "AZURE_CLIENT_SECRET",
        "NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT",
    ]
    result = {}
    for key in keys:
        value = os.environ.get(key, "")
        if not value:
            result[key] = "missing"
        elif is_placeholder(value):
            result[key] = "placeholder"
        elif key.endswith("SECRET") or key.endswith("API_KEY"):
            result[key] = "set-secret"
        else:
            result[key] = "set"
    print_json(result)


def list_knowledge_sources(args: argparse.Namespace) -> None:
    print_json(request("GET", "/knowledgesources", api_version(args)))


def list_knowledge_bases(args: argparse.Namespace) -> None:
    print_json(request("GET", "/knowledgebases", api_version(args)))


def create_search_index_ks(args: argparse.Namespace) -> None:
    name = args.ks_name or default_ks_name(args.domain, "search-index-ks")
    body = {
        "name": name,
        "kind": "searchIndex",
        "description": args.description or f"{args.domain} Search index knowledge source.",
        "searchIndexParameters": {
            "searchIndexName": args.index_name,
        },
    }
    emit_or_request(args, "PUT", f"/knowledgesources/{name}", api_version(args), body)


def create_fabric_ontology_ks(args: argparse.Namespace) -> None:
    name = args.ks_name or default_ks_name(args.domain, "fabric-ontology-ks")
    body = {
        "name": name,
        "kind": "fabricOntology",
        "description": args.description or f"{args.domain} Fabric IQ ontology knowledge source.",
        "fabricOntologyParameters": {
            "workspaceId": args.workspace_id,
            "ontologyId": args.ontology_id,
        },
    }
    emit_or_request(args, "PUT", f"/knowledgesources/{name}", args.api_version, body)


def create_mcp_ks(args: argparse.Namespace) -> None:
    name = args.ks_name or default_ks_name(args.domain, "mcp-ks")
    body = {
        "name": name,
        "kind": "mcpServer",
        "description": args.description or f"{args.domain} MCP Server knowledge source.",
        "mcpServerParameters": {
            "serverURL": args.server_url,
            "tools": [
                {
                    "name": args.tool,
                    "outputParsing": {"kind": args.output_parsing},
                    "inclusionMode": args.inclusion_mode,
                    "maxOutputTokens": args.max_output_tokens,
                }
            ],
        },
    }
    emit_or_request(
        args,
        "PUT",
        f"/knowledgesources/{name}",
        args.api_version,
        body,
        {"Prefer": "return=representation"},
    )


def model_parameters(model: str) -> dict[str, Any]:
    params: dict[str, Any] = {
        "resourceUri": os.environ.get("NEXT_PUBLIC_AZURE_OPENAI_ENDPOINT", "").rstrip("/"),
        "deploymentId": model,
        "modelName": model,
    }
    api_key = os.environ.get("FOUNDRY_API_KEY") or os.environ.get("AZURE_OPENAI_API_KEY")
    if api_key and not is_placeholder(api_key):
        params["apiKey"] = api_key
    return params


def create_kb(args: argparse.Namespace) -> None:
    body = {
        "name": args.kb_name,
        "description": args.description or f"{args.kb_name} knowledge base.",
        "models": [
            {
                "kind": "azureOpenAI",
                "azureOpenAIParameters": model_parameters(args.model),
            }
        ],
        "knowledgeSources": [{"name": source} for source in args.ks],
        "retrievalReasoningEffort": {"kind": args.reasoning_effort},
        "outputMode": args.output_mode,
    }
    emit_or_request(args, "PUT", f"/knowledgebases/{args.kb_name}", api_version(args), body)


def retrieve(args: argparse.Namespace) -> None:
    body = {
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": args.question,
                    }
                ],
            }
        ],
        "maxRuntimeInSeconds": args.max_runtime,
    }
    if args.ks:
        body["knowledgeSourceParams"] = [
            {
                "knowledgeSourceName": source,
                "kind": args.kind,
                "includeReferenceSourceData": args.include_source_data,
            }
            for source in args.ks
        ]

    extra_headers = {}
    if args.user_token:
        extra_headers["x-ms-query-source-authorization"] = args.user_token
    emit_or_request(args, "POST", f"/knowledgebases/{args.kb_name}/retrieve", api_version(args), body, extra_headers)


def emit_delete(args: argparse.Namespace, path: str) -> None:
    if getattr(args, "dry_run", False):
        print_json(
            {
                "dryRun": True,
                "method": "DELETE",
                "path": path,
                "apiVersion": api_version(args),
            }
        )
        return

    if not args.yes:
        raise SystemExit("Refusing to delete without --yes")

    print_json(request("DELETE", path, api_version(args)))


def delete_knowledge_source(args: argparse.Namespace) -> None:
    emit_delete(args, f"/knowledgesources/{args.ks_name}")


def delete_knowledge_base(args: argparse.Namespace) -> None:
    emit_delete(args, f"/knowledgebases/{args.kb_name}")


def add_payload_options(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--dry-run", action="store_true", help="Print the redacted REST request without calling Azure Search.")
    parser.add_argument("--save-payload", help="Write the redacted request body to a file.")


def add_delete_options(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--api-version")
    parser.add_argument("--dry-run", action="store_true", help="Print the DELETE request without calling Azure Search.")
    parser.add_argument("--yes", action="store_true", help="Required for actual deletion.")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Create Foundry IQ Knowledge Sources and Knowledge Bases with simple inputs.")
    parser.add_argument("--env-file", default=str(DEFAULT_ENV), help="Path to .env.local")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("check", help="Show required environment key status without printing secrets.").set_defaults(func=check)

    list_ks = sub.add_parser("list-ks", help="List knowledge sources.")
    list_ks.add_argument("--api-version")
    list_ks.set_defaults(func=list_knowledge_sources)

    list_kb = sub.add_parser("list-kb", help="List knowledge bases.")
    list_kb.add_argument("--api-version")
    list_kb.set_defaults(func=list_knowledge_bases)

    search_index = sub.add_parser("create-search-index-ks", help="Create a knowledge source over an existing Search index.")
    search_index.add_argument("--domain", required=True)
    search_index.add_argument("--ks-name")
    search_index.add_argument("--index-name", required=True)
    search_index.add_argument("--description")
    search_index.add_argument("--api-version")
    add_payload_options(search_index)
    search_index.set_defaults(func=create_search_index_ks)

    fabric = sub.add_parser("create-fabric-ontology-ks", help="Create a Fabric IQ ontology knowledge source.")
    fabric.add_argument("--domain", required=True)
    fabric.add_argument("--ks-name")
    fabric.add_argument("--workspace-id", required=True)
    fabric.add_argument("--ontology-id", required=True)
    fabric.add_argument("--description")
    fabric.add_argument("--api-version", default=PREVIEW_API_VERSION)
    add_payload_options(fabric)
    fabric.set_defaults(func=create_fabric_ontology_ks)

    mcp = sub.add_parser("create-mcp-ks", help="Create an MCP Server knowledge source.")
    mcp.add_argument("--domain", required=True)
    mcp.add_argument("--ks-name")
    mcp.add_argument("--server-url", required=True)
    mcp.add_argument("--tool", required=True)
    mcp.add_argument("--description")
    mcp.add_argument("--output-parsing", default="auto", choices=["auto", "json", "split", "none"])
    mcp.add_argument("--inclusion-mode", default="reranked", choices=["reranked", "always"])
    mcp.add_argument("--max-output-tokens", type=int, default=1000)
    mcp.add_argument("--api-version", default=PREVIEW_API_VERSION)
    add_payload_options(mcp)
    mcp.set_defaults(func=create_mcp_ks)

    kb = sub.add_parser("create-kb", help="Create a knowledge base and attach one or more knowledge sources.")
    kb.add_argument("--kb-name", required=True)
    kb.add_argument("--ks", action="append", required=True, help="Knowledge source name. Repeat for multiple sources.")
    kb.add_argument("--model", default="gpt-4o")
    kb.add_argument("--description")
    kb.add_argument("--reasoning-effort", default="low", choices=["low", "medium", "high"])
    kb.add_argument("--output-mode", default="answerSynthesis", choices=["answerSynthesis", "extractiveData"])
    kb.add_argument("--api-version")
    add_payload_options(kb)
    kb.set_defaults(func=create_kb)

    retrieve_cmd = sub.add_parser("retrieve", help="Query a knowledge base.")
    retrieve_cmd.add_argument("--kb-name", required=True)
    retrieve_cmd.add_argument("--question", required=True)
    retrieve_cmd.add_argument("--ks", action="append", help="Optional knowledge source name. Repeat for multiple sources.")
    retrieve_cmd.add_argument("--kind", default="searchIndex")
    retrieve_cmd.add_argument("--include-source-data", action="store_true")
    retrieve_cmd.add_argument("--user-token", help="End-user x-ms-query-source-authorization token for Fabric/ACL sources.")
    retrieve_cmd.add_argument("--max-runtime", type=int, default=120)
    retrieve_cmd.add_argument("--api-version")
    add_payload_options(retrieve_cmd)
    retrieve_cmd.set_defaults(func=retrieve)

    delete_ks = sub.add_parser("delete-ks", help="Delete a knowledge source.")
    delete_ks.add_argument("--ks-name", required=True)
    add_delete_options(delete_ks)
    delete_ks.set_defaults(func=delete_knowledge_source)

    delete_kb = sub.add_parser("delete-kb", help="Delete a knowledge base.")
    delete_kb.add_argument("--kb-name", required=True)
    add_delete_options(delete_kb)
    delete_kb.set_defaults(func=delete_knowledge_base)

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    load_env(Path(args.env_file))
    args.func(args)


if __name__ == "__main__":
    main()
