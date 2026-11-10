#!/usr/bin/env python3
"""Deploy the small Azure-only Web IQ usage ledger service with Azure CLI credentials.

No account keys, policy exemptions, public Blob access, or container registry are used.
The bundled Node source is mounted as an immutable, revision-specific secret file.
Pass --config <git-ignored local JSON> to every command. Run --stage network,
then --stage app --bundle <git-ignored bundle>, then --stage status.
The config supplies subscription, tenant, region, resourceGroup, storageAccountName,
containerName, blobName, perimeterName, profileName, environmentName, and appName.
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import time
import urllib.error
import urllib.request
import uuid


ROOT = Path(__file__).resolve().parents[1]
NODE_IMAGE = "docker.io/library/node:22-alpine@sha256:0e1754758c2df4cfa3e68d59e2e1b7374bb7fd9ea6328eaaacf15cc934af8202"
TAGS = {"purpose": "web-iq-usage-budget", "project": "foundry-iq-demos"}
STATE_PATH = ROOT / "tasks/web-iq-live/usage-broker.local.json"
ENV_PATH = ROOT / ".env.local"
API_APP = "2026-01-01"
API_NETWORK = "2026-01-01"
API_STORAGE = "2025-06-01"


def safe_write(path, text):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = ROOT / "tasks/web-iq-live" / (path.name + "." + secrets.token_hex(8) + ".tmp")
    temporary.parent.mkdir(parents=True, exist_ok=True)
    ignored(temporary)
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as stream:
        stream.write(text)
    os.chmod(temporary, 0o600)
    os.replace(temporary, path)


def ignored(path):
    result = subprocess.run(["git", "check-ignore", "-q", str(path)], cwd=ROOT, capture_output=True)
    if result.returncode:
        raise RuntimeError(f"Refusing a non-ignored local artifact: {path.name}")


def load_config(path):
    """Validate local resource names, then derive ARM IDs without accepting URLs or paths."""
    path = path.resolve()
    ignored(path)
    patterns = {
        "subscription": r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}",
        "tenant": r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}",
        "resourceGroup": r"[A-Za-z0-9_()-][A-Za-z0-9_.()-]{0,88}[A-Za-z0-9_()-]|[A-Za-z0-9_()-]",
        "region": r"[a-z][a-z0-9]{1,31}",
        "storageAccountName": r"[a-z0-9]{3,24}",
        "containerName": r"[a-z0-9](?:[a-z0-9]|-(?!-)){1,61}[a-z0-9]",
        "blobName": r"[A-Za-z0-9][A-Za-z0-9._-]{0,127}",
        "perimeterName": r"[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,78}[A-Za-z0-9_])?",
        "profileName": r"[A-Za-z0-9](?:[A-Za-z0-9_.-]{0,78}[A-Za-z0-9_])?",
        "environmentName": r"[a-z](?:[a-z0-9]|-(?!-)){0,58}[a-z0-9]|[a-z]",
        "appName": r"[a-z](?:[a-z0-9]|-(?!-)){0,30}[a-z0-9]|[a-z]",
    }

    def unique_object(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError("Duplicate config key")
            result[key] = value
        return result

    try:
        if path.suffix != ".json" or path.stat().st_size > 16_384:
            raise ValueError("Unexpected config file")
        values = json.loads(path.read_text(), object_pairs_hook=unique_object)
    except (OSError, UnicodeError, ValueError):
        raise RuntimeError("Deployment config must be a readable local JSON object under 16 KiB.") from None
    if not isinstance(values, dict) or set(values) != set(patterns):
        raise RuntimeError("Deployment config must contain exactly: " + ", ".join(patterns))
    for key, pattern in patterns.items():
        if not isinstance(values[key], str) or not re.fullmatch(pattern, values[key]):
            raise RuntimeError(f"Invalid deployment config field: {key}")
    subscription, tenant = str(uuid.UUID(values["subscription"])), str(uuid.UUID(values["tenant"]))
    base = f"/subscriptions/{subscription}/resourceGroups/{values['resourceGroup']}"
    storage = base + "/providers/Microsoft.Storage/storageAccounts/" + values["storageAccountName"]
    nsp = base + "/providers/Microsoft.Network/networkSecurityPerimeters/" + values["perimeterName"]
    return argparse.Namespace(
        subscription=subscription, tenant=tenant, resource_group=values["resourceGroup"], region=values["region"],
        storage=storage, container=storage + "/blobServices/default/containers/" + values["containerName"],
        nsp=nsp, profile=nsp + "/profiles/" + values["profileName"],
        environment=base + "/providers/Microsoft.App/managedEnvironments/" + values["environmentName"],
        app=base + "/providers/Microsoft.App/containerApps/" + values["appName"],
        blob_url=f"https://{values['storageAccountName']}.blob.core.windows.net/{values['containerName']}/{values['blobName']}",
    )


def env_values():
    values = {}
    for line in ENV_PATH.read_text().splitlines():
        match = re.match(r"^([A-Z][A-Z0-9_]*)=(.*)$", line)
        if match:
            value = match[2].strip()
            if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
                value = value[1:-1]
            values[match[1]] = value
    return values


def save_env(updates):
    ignored(ENV_PATH)
    lines = ENV_PATH.read_text().splitlines()
    for key, value in updates.items():
        replacement = f"{key}={value}"
        matches = [i for i, line in enumerate(lines) if line.startswith(key + "=")]
        if len(matches) > 1:
            raise RuntimeError(f"Duplicate environment key: {key}")
        if matches:
            lines[matches[0]] = replacement
        else:
            lines.append(replacement)
    safe_write(ENV_PATH, "\n".join(lines) + "\n")


class Arm:
    def __init__(self, config):
        self.config = config
        account = json.loads(subprocess.check_output(["az", "account", "show", "-o", "json"]))
        if account["id"].lower() != config.subscription or account["tenantId"].lower() != config.tenant:
            raise RuntimeError("Select the subscription and tenant specified in --config before deploying.")
        self.token = subprocess.check_output([
            "az", "account", "get-access-token", "--subscription", config.subscription,
            "--resource", "https://management.azure.com/", "--query", "accessToken", "-o", "tsv",
        ], text=True).strip()

    def request(self, method, resource, api, body=None, optional=False, attempt=0):
        url = f"https://management.azure.com{resource}?api-version={api}"
        data = None if body is None else json.dumps(body).encode()
        request = urllib.request.Request(url, data=data, method=method, headers={
            "Authorization": "Bearer " + self.token, "Content-Type": "application/json",
        })
        try:
            with urllib.request.urlopen(request, timeout=60) as response:
                raw = response.read()
                return json.loads(raw) if raw else {}
        except urllib.error.HTTPError as error:
            if optional and error.code == 404:
                return None
            if method == "GET" and error.code in (408, 429, 500, 502, 503, 504) and attempt < 2:
                error.close()
                time.sleep(attempt + 1)
                return self.request(method, resource, api, optional=optional, attempt=attempt + 1)
            try:
                details = json.loads(error.read() or b"{}").get("error", {})
            except (json.JSONDecodeError, AttributeError):
                details = {"code": "NonJsonErrorResponse", "message": "Azure returned an unreadable error response."}
            message = details.get("message", "Request failed")
            # Azure diagnostics must never echo an input secret or the ARM token.
            for secret in [self.token, *env_values().values()]:
                if len(secret) >= 16:
                    message = message.replace(secret, "[redacted]")
            raise RuntimeError(f"ARM {error.code} {details.get('code', '')}: {message[:1500]}") from None
        except (urllib.error.URLError, TimeoutError):
            if method == "GET" and attempt < 2:
                time.sleep(attempt + 1)
                return self.request(method, resource, api, optional=optional, attempt=attempt + 1)
            raise RuntimeError(f"ARM {method} transport failed; inspect resource state before retrying a write.") from None

    def owned(self, resource, api):
        current = self.request("GET", resource, api, optional=True)
        if current and current.get("tags", {}).get("purpose") != TAGS["purpose"]:
            raise RuntimeError(f"Refusing to change an existing resource without ownership tag: {resource}")
        return current

    def wait(self, resource, api, seconds=600):
        end = time.monotonic() + seconds
        last = None
        while time.monotonic() < end:
            current = self.request("GET", resource, api)
            state = current.get("properties", {}).get("provisioningState", "Succeeded")
            if state != last:
                print(json.dumps({"resource": resource.rsplit("/", 1)[-1], "state": state}), flush=True)
                last = state
            if state == "Succeeded":
                return current
            if state in ("Failed", "Canceled"):
                raise RuntimeError(f"Provisioning {state}: {resource}")
            time.sleep(10)
        raise RuntimeError(f"Provisioning still pending after {seconds}s: {resource}")


def network(arm):
    config = arm.config
    storage = arm.request("GET", config.storage, API_STORAGE)
    if storage.get("tags", {}).get("purpose") not in ("demo-usage-budget", TAGS["purpose"]):
        raise RuntimeError("The dedicated ledger storage ownership tag did not match.")
    if storage["properties"].get("allowSharedKeyAccess") is not False:
        raise RuntimeError("Dedicated ledger must already have shared-key access disabled.")
    arm.owned(config.nsp, API_NETWORK)
    arm.request("PUT", config.nsp, API_NETWORK, {"location": config.region, "tags": TAGS, "properties": {}})
    arm.wait(config.nsp, API_NETWORK)
    arm.request("PUT", config.profile, API_NETWORK, {"properties": {}})
    arm.request("PUT", config.profile + "/accessRules/azure-demo-subscription", API_NETWORK, {
        "properties": {"direction": "Inbound", "subscriptions": [{"id": f"/subscriptions/{config.subscription}"}]},
    })
    association = config.nsp + "/resourceAssociations/usage-storage"
    arm.request("PUT", association, API_NETWORK, {
        "properties": {"privateLinkResource": {"id": config.storage}, "profile": {"id": config.profile}, "accessMode": "Enforced"},
    })
    arm.wait(association, API_NETWORK)
    arm.request("PATCH", config.storage, API_STORAGE, {"properties": {"publicNetworkAccess": "SecuredByPerimeter"}})
    secured = arm.request("GET", config.storage, API_STORAGE)
    if secured["properties"].get("publicNetworkAccess") != "SecuredByPerimeter":
        raise RuntimeError("Storage did not retain SecuredByPerimeter; do not deploy a bypass.")
    print(json.dumps({"storageNetwork": "SecuredByPerimeter", "perimeter": "Enforced"}), flush=True)
    current = arm.owned(config.environment, API_APP)
    if not current:
        arm.request("PUT", config.environment, API_APP, {
            "location": config.region, "tags": TAGS,
            "properties": {"zoneRedundant": False,
                "workloadProfiles": [{"name": "Consumption", "workloadProfileType": "Consumption"}]},
        })
    arm.wait(config.environment, API_APP)


def app(arm, bundle_path):
    config = arm.config
    ignored(bundle_path)
    source = bundle_path.read_text()
    if not source or len(source.encode()) > 128_000:
        raise RuntimeError("Unexpected broker bundle size.")
    digest = hashlib.sha256(source.encode()).hexdigest()[:12]
    source_secret = "source-" + digest
    values = env_values()
    if len(values.get("DEMO_USAGE_HASH_SECRET", "")) < 32:
        raise RuntimeError("An existing stable IP hash secret is required.")
    broker_secret = values.get("DEMO_USAGE_BROKER_SECRET") or secrets.token_hex(32)
    if len(broker_secret) < 32:
        raise RuntimeError("Broker secret is too short.")
    # Persist generated credentials before an Azure write, without exposing them in argv/logs.
    save_env({"DEMO_USAGE_BROKER_SECRET": broker_secret})
    existing = arm.owned(config.app, API_APP)
    # Old revisions can still reference old bundles. Keep those source secrets until
    # an operator explicitly removes retired revisions; do not break rollback.
    retained_sources = []
    if existing:
        previous = arm.request("POST", config.app + "/listSecrets", API_APP, {})
        retained_sources = [item for item in previous.get("value", [])
            if re.fullmatch(r"source-[0-9a-f]{12}", item.get("name", ""))
            and item["name"] != source_secret and isinstance(item.get("value"), str)]
    body = {
        "location": config.region, "tags": TAGS, "identity": {"type": "SystemAssigned"},
        "properties": {
            "environmentId": config.environment, "workloadProfileName": "Consumption",
            "configuration": {
                "activeRevisionsMode": "Single",
                "ingress": {"external": True, "targetPort": 8080, "transport": "http", "allowInsecure": False,
                    "traffic": [{"latestRevision": True, "weight": 100}]},
                "secrets": [*retained_sources, {"name": source_secret, "value": source},
                    {"name": "broker-secret", "value": broker_secret},
                    {"name": "ip-hash-secret", "value": values["DEMO_USAGE_HASH_SECRET"]}],
            },
            "template": {
                "containers": [{"name": "ledger", "image": NODE_IMAGE,
                    "command": ["node", "/app/server.cjs"],
                    "resources": {"cpu": 0.25, "memory": "0.5Gi"},
                    "env": [{"name": "PORT", "value": "8080"},
                        {"name": "NODE_ENV", "value": "production"},
                        {"name": "DEMO_USAGE_BLOB_URL", "value": config.blob_url},
                        {"name": "DEMO_USAGE_HASH_SECRET", "secretRef": "ip-hash-secret"},
                        {"name": "DEMO_USAGE_BROKER_SECRET", "secretRef": "broker-secret"}],
                    "volumeMounts": [{"volumeName": "source", "mountPath": "/app"}],
                    "probes": [
                        {"type": "Liveness", "httpGet": {"path": "/health", "port": 8080}, "periodSeconds": 30},
                        {"type": "Readiness", "httpGet": {"path": "/health", "port": 8080}, "periodSeconds": 10},
                    ],
                }],
                "volumes": [{"name": "source", "storageType": "Secret", "secrets": [{"secretRef": source_secret, "path": "server.cjs"}]}],
                # Keep one small replica: live scale-from-zero exceeded the app's
                # 25-second safety deadline. HTTP scaling ignores pollingInterval.
                "scale": {"minReplicas": 1, "maxReplicas": 1,
                    "rules": [{"name": "http", "http": {"metadata": {"concurrentRequests": "10"}}}]},
            },
        },
    }
    # Revisions are immutable. Configuration and credential changes also need a
    # new revision even when the JavaScript bundle itself did not change.
    revision_fingerprint = json.dumps({"template": body["properties"]["template"],
        "credentialHash": hashlib.sha256((broker_secret + values["DEMO_USAGE_HASH_SECRET"]).encode()).hexdigest(),
    }, sort_keys=True).encode()
    body["properties"]["template"]["revisionSuffix"] = "r" + hashlib.sha256(revision_fingerprint).hexdigest()[:16]
    arm.request("PUT", config.app, API_APP, body)
    current = arm.wait(config.app, API_APP)
    principal = current["identity"]["principalId"]
    role = f"/subscriptions/{config.subscription}/providers/Microsoft.Authorization/roleDefinitions/ba92f5b4-2d11-453d-a403-e96b0029c9fe"
    assignment = str(uuid.uuid5(uuid.NAMESPACE_URL, config.container + principal + role))
    arm.request("PUT", config.container + "/providers/Microsoft.Authorization/roleAssignments/" + assignment, "2022-04-01", {
        "properties": {"principalId": principal, "principalType": "ServicePrincipal", "roleDefinitionId": role},
    })
    url = "https://" + current["properties"]["configuration"]["ingress"]["fqdn"]
    save_env({"DEMO_USAGE_BROKER_URL": url})
    ignored(STATE_PATH)
    safe_write(STATE_PATH, json.dumps({
        "subscription": config.subscription, "tenant": config.tenant, "resourceGroup": config.resource_group,
        "containerApp": config.app, "environment": config.environment, "perimeter": config.nsp,
        "storage": config.storage, "container": config.container, "brokerUrl": url, "principalId": principal,
        "roleAssignment": assignment, "sourceSha256": digest, "image": NODE_IMAGE,
        "verification": "pending", "budgetScope": "web-iq", "dailyBudgetUsd": 5,
        "replicas": {"minimum": 1, "maximum": 1},
        "infrastructureCostScope": "Separate from Web IQ API budget; 0.25 vCPU and 0.5 GiB Consumption",
    }, indent=2) + "\n")
    print(json.dumps({"brokerUrl": url, "identityRoleScope": "ledger container", "verification": "pending"}), flush=True)


def status(arm):
    config = arm.config
    for name, resource, api in [("perimeter", config.nsp, API_NETWORK), ("environment", config.environment, API_APP), ("broker", config.app, API_APP)]:
        value = arm.request("GET", resource, api, optional=True)
        print(json.dumps({"resource": name, "exists": value is not None,
            "state": (value or {}).get("properties", {}).get("provisioningState")}))
    storage = arm.request("GET", config.storage, API_STORAGE)
    print(json.dumps({"storageNetwork": storage["properties"].get("publicNetworkAccess"),
        "sharedKeyAccess": storage["properties"].get("allowSharedKeyAccess"),
        "anonymousBlobAccess": storage["properties"].get("allowBlobPublicAccess")}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", type=Path, required=True, help="Git-ignored local JSON containing deployment resource names")
    parser.add_argument("--stage", choices=("network", "app", "status"), required=True)
    parser.add_argument("--bundle", type=Path)
    args = parser.parse_args()
    try:
        config = load_config(args.config)
        client = Arm(config)
        if args.stage == "network":
            network(client)
        elif args.stage == "app":
            if not args.bundle:
                parser.error("--bundle is required for --stage app")
            app(client, args.bundle.resolve())
        else:
            status(client)
    except (RuntimeError, urllib.error.URLError) as error:
        print(str(error), flush=True)
        raise SystemExit(1)
