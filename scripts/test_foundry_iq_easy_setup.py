import io
import json
import os
import sys
import tempfile
import unittest
from argparse import Namespace
from contextlib import redirect_stdout
from pathlib import Path
from unittest.mock import patch


SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

import foundry_iq_easy_setup as helper  # noqa: E402


class FoundryIqEasySetupTests(unittest.TestCase):
    def test_load_env_strips_quotes_and_inline_comments(self) -> None:
        with tempfile.TemporaryDirectory() as temp_dir:
            env_path = Path(temp_dir) / ".env.local"
            env_path.write_text(
                "\n".join(
                    [
                        'AZURE_SEARCH_ENDPOINT="https://example.search.windows.net" # local',
                        "AZURE_SEARCH_USE_RBAC=true",
                        "# ignored",
                    ]
                ),
                encoding="utf-8",
            )

            with patch.dict(os.environ, {}, clear=True):
                helper.load_env(env_path)

                self.assertEqual(
                    os.environ["AZURE_SEARCH_ENDPOINT"],
                    "https://example.search.windows.net",
                )
                self.assertEqual(os.environ["AZURE_SEARCH_USE_RBAC"], "true")

    def test_required_env_rejects_placeholders(self) -> None:
        with patch.dict(os.environ, {"AZURE_CLIENT_ID": "your-app-id-here"}, clear=True):
            with self.assertRaises(SystemExit) as raised:
                helper.required_env("AZURE_CLIENT_ID")

        self.assertIn("placeholder", str(raised.exception))

    def test_redact_secrets_recursively(self) -> None:
        payload = {
            "name": "demo",
            "apiKey": "secret-value",
            "nested": {
                "client_secret": "secret-value",
                "items": [{"Authorization": "Bearer token"}],
            },
        }

        self.assertEqual(
            helper.redact_secrets(payload),
            {
                "name": "demo",
                "apiKey": "***redacted***",
                "nested": {
                    "client_secret": "***redacted***",
                    "items": [{"Authorization": "***redacted***"}],
                },
            },
        )

    def test_dry_run_does_not_call_request_and_redacts_headers(self) -> None:
        args = Namespace(dry_run=True, save_payload=None)
        body = {"name": "demo", "apiKey": "secret-value"}
        extra_headers = {"Authorization": "Bearer token"}

        with patch.object(helper, "request") as request_mock:
            out = io.StringIO()
            with redirect_stdout(out):
                helper.emit_or_request(
                    args,
                    "PUT",
                    "/knowledgesources/demo",
                    helper.DEFAULT_API_VERSION,
                    body,
                    extra_headers,
                )

        request_mock.assert_not_called()
        printed = json.loads(out.getvalue())
        self.assertTrue(printed["dryRun"])
        self.assertEqual(printed["body"]["apiKey"], "***redacted***")
        self.assertEqual(printed["extraHeaders"]["Authorization"], "***redacted***")

    def test_delete_requires_yes(self) -> None:
        args = Namespace(dry_run=False, yes=False, api_version=None, kb_name="demo-kb")

        with self.assertRaises(SystemExit) as raised:
            helper.delete_knowledge_base(args)

        self.assertIn("--yes", str(raised.exception))

    def test_parser_includes_delete_commands(self) -> None:
        parser = helper.build_parser()

        ks_args = parser.parse_args(["delete-ks", "--ks-name", "demo-ks", "--yes"])
        kb_args = parser.parse_args(["delete-kb", "--kb-name", "demo-kb", "--yes"])

        self.assertEqual(ks_args.func, helper.delete_knowledge_source)
        self.assertEqual(kb_args.func, helper.delete_knowledge_base)


if __name__ == "__main__":
    unittest.main()
