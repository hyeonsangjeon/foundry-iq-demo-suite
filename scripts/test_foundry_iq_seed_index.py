import json
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

import foundry_iq_seed_index as seed  # noqa: E402


class FoundryIqSeedIndexTests(unittest.TestCase):
    def test_read_jsonl_records(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "docs.jsonl"
            path.write_text('{"id":"1","content":"alpha"}\n{"id":"2","content":"beta"}\n', encoding="utf-8")

            rows = seed.read_records(path)

        self.assertEqual([row["id"] for row in rows], ["1", "2"])

    def test_read_json_value_array(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            path = Path(temp_dir) / "docs.json"
            path.write_text(json.dumps({"value": [{"id": "1", "content": "alpha"}]}), encoding="utf-8")

            rows = seed.read_records(path)

        self.assertEqual(rows[0]["content"], "alpha")

    def test_normalize_records_builds_search_actions(self) -> None:
        docs = seed.normalize_records(
            [{"id": 1, "title": "Policy", "content": "Refund rules", "category": "policy"}],
            key_field="id",
            title_field="title",
            content_field="content",
            category_field="category",
            source_field="source",
        )

        self.assertEqual(docs[0]["@search.action"], "mergeOrUpload")
        self.assertEqual(docs[0]["id"], "1")
        self.assertEqual(docs[0]["category"], "policy")
        self.assertEqual(docs[0]["source"], "local")

    def test_normalize_records_requires_content(self) -> None:
        with self.assertRaises(SystemExit) as raised:
            seed.normalize_records(
                [{"id": "missing"}],
                key_field="id",
                title_field="title",
                content_field="content",
                category_field="category",
                source_field="source",
            )

        self.assertIn("no content", str(raised.exception))

    def test_index_definition_has_semantic_config(self) -> None:
        body = seed.index_definition("demo-index")

        self.assertEqual(body["name"], "demo-index")
        self.assertEqual(body["semantic"]["configurations"][0]["name"], "default")


if __name__ == "__main__":
    unittest.main()
