#!/usr/bin/env python3
"""
Seed a simple Azure AI Search index from JSON, JSONL, or CSV.

This is intentionally small and beginner-friendly. It creates a conventional
text index that can immediately be attached to a Foundry IQ Knowledge Source.
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from pathlib import Path
from typing import Any


SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

import foundry_iq_easy_setup as helper  # noqa: E402


DEFAULT_SEMANTIC_CONFIG = "default"


def read_json_or_jsonl(path: Path) -> list[dict[str, Any]]:
    text = path.read_text(encoding="utf-8-sig").strip()
    if not text:
        raise SystemExit(f"Data file is empty: {path}")

    if path.suffix.lower() == ".jsonl":
        rows = []
        for line_number, line in enumerate(text.splitlines(), start=1):
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
            except json.JSONDecodeError as exc:
                raise SystemExit(f"Invalid JSONL at line {line_number}: {exc}") from exc
            if not isinstance(item, dict):
                raise SystemExit(f"JSONL line {line_number} must be an object")
            rows.append(item)
        return rows

    try:
        payload = json.loads(text)
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON: {exc}") from exc

    if isinstance(payload, dict) and isinstance(payload.get("value"), list):
        payload = payload["value"]
    if not isinstance(payload, list):
        raise SystemExit("JSON data must be an array or an object with a 'value' array")
    if not all(isinstance(item, dict) for item in payload):
        raise SystemExit("Every JSON item must be an object")
    return payload


def read_csv(path: Path) -> list[dict[str, Any]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        return [dict(row) for row in csv.DictReader(handle)]


def read_records(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        raise SystemExit(f"Data file not found: {path}")
    if path.suffix.lower() == ".csv":
        rows = read_csv(path)
    else:
        rows = read_json_or_jsonl(path)
    if not rows:
        raise SystemExit(f"No records found in {path}")
    return rows


def value(record: dict[str, Any], field: str | None) -> Any:
    if not field:
        return None
    return record.get(field)


def normalize_records(
    records: list[dict[str, Any]],
    *,
    key_field: str,
    title_field: str,
    content_field: str,
    category_field: str | None,
    source_field: str | None,
) -> list[dict[str, Any]]:
    docs = []
    missing_content = []
    for idx, record in enumerate(records, start=1):
        content = value(record, content_field)
        if content is None or str(content).strip() == "":
            missing_content.append(str(value(record, key_field) or idx))
            continue

        key = value(record, key_field) or f"doc-{idx:04d}"
        title = value(record, title_field) or value(record, key_field) or f"Document {idx}"
        docs.append(
            {
                "@search.action": "mergeOrUpload",
                "id": str(key),
                "title": str(title),
                "content": str(content),
                "category": str(value(record, category_field) or "general"),
                "source": str(value(record, source_field) or Path("local").as_posix()),
            }
        )

    if missing_content:
        sample = ", ".join(missing_content[:5])
        raise SystemExit(
            f"{len(missing_content)} record(s) have no content in field '{content_field}'. "
            f"Sample ids: {sample}"
        )
    return docs


def index_definition(index_name: str) -> dict[str, Any]:
    return {
        "name": index_name,
        "fields": [
            {"name": "id", "type": "Edm.String", "key": True, "filterable": True, "sortable": True},
            {"name": "title", "type": "Edm.String", "searchable": True, "filterable": True, "sortable": True},
            {"name": "content", "type": "Edm.String", "searchable": True},
            {"name": "category", "type": "Edm.String", "searchable": True, "filterable": True, "facetable": True},
            {"name": "source", "type": "Edm.String", "searchable": True, "filterable": True, "facetable": True},
        ],
        "semantic": {
            "configurations": [
                {
                    "name": DEFAULT_SEMANTIC_CONFIG,
                    "prioritizedFields": {
                        "titleField": {"fieldName": "title"},
                        "prioritizedContentFields": [{"fieldName": "content"}],
                        "prioritizedKeywordsFields": [
                            {"fieldName": "category"},
                            {"fieldName": "source"},
                        ],
                    },
                }
            ]
        },
    }


def print_json(data: Any) -> None:
    print(json.dumps(data, indent=2, ensure_ascii=False))


def chunks(items: list[dict[str, Any]], size: int) -> list[list[dict[str, Any]]]:
    return [items[i : i + size] for i in range(0, len(items), size)]


def seed_index(args: argparse.Namespace) -> None:
    helper.load_env(Path(args.env_file))
    version = args.api_version
    records = read_records(Path(args.data_file))
    docs = normalize_records(
        records,
        key_field=args.key_field,
        title_field=args.title_field,
        content_field=args.content_field,
        category_field=args.category_field,
        source_field=args.source_field,
    )
    index_body = index_definition(args.index_name)

    if args.dry_run:
        print_json(
            {
                "dryRun": True,
                "index": index_body,
                "documentCount": len(docs),
                "sampleDocuments": docs[: min(3, len(docs))],
                "nextCommand": (
                    "python scripts/foundry_iq_easy_setup.py create-search-index-ks "
                    f"--domain {args.domain} --ks-name {args.domain}-search-ks "
                    f"--index-name {args.index_name}"
                ),
            }
        )
        return

    if args.replace:
        try:
            helper.request("DELETE", f"/indexes/{args.index_name}", version)
        except SystemExit as exc:
            if '"status": 404' not in str(exc):
                raise

    helper.request("PUT", f"/indexes/{args.index_name}", version, index_body)
    uploaded = 0
    for batch in chunks(docs, args.batch_size):
        response = helper.request(
            "POST",
            f"/indexes/{args.index_name}/docs/index",
            version,
            {"value": batch},
        )
        uploaded += len(response.get("value", batch)) if isinstance(response, dict) else len(batch)

    print_json(
        {
            "indexName": args.index_name,
            "documentsUploaded": uploaded,
            "semanticConfiguration": DEFAULT_SEMANTIC_CONFIG,
            "next": [
                (
                    "python scripts/foundry_iq_easy_setup.py create-search-index-ks "
                    f"--domain {args.domain} --ks-name {args.domain}-search-ks "
                    f"--index-name {args.index_name}"
                ),
                (
                    "python scripts/foundry_iq_easy_setup.py create-kb "
                    f"--kb-name {args.domain}-kb --ks {args.domain}-search-ks --model gpt-4o"
                ),
            ],
        }
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Seed a simple Azure AI Search index for Foundry IQ demos.")
    parser.add_argument("--env-file", default=str(helper.DEFAULT_ENV))
    parser.add_argument("--api-version", default=helper.DEFAULT_API_VERSION)
    parser.add_argument("--domain", default="demo", help="Short domain name used in suggested KS/KB names.")
    parser.add_argument("--index-name", required=True)
    parser.add_argument("--data-file", required=True)
    parser.add_argument("--key-field", default="id")
    parser.add_argument("--title-field", default="title")
    parser.add_argument("--content-field", default="content")
    parser.add_argument("--category-field", default="category")
    parser.add_argument("--source-field", default="source")
    parser.add_argument("--batch-size", type=int, default=500)
    parser.add_argument("--replace", action="store_true", help="Delete and recreate the index first.")
    parser.add_argument("--dry-run", action="store_true", help="Print the index and sample documents only.")
    return parser


def main() -> None:
    seed_index(build_parser().parse_args())


if __name__ == "__main__":
    main()
