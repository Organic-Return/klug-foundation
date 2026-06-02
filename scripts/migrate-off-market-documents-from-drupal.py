#!/usr/bin/env python3
"""
Backfill off-market listing documents from Drupal into Sanity.

Drupal stores supplementary docs under each off_market_listings node's
field_property_documents relationship:

  off_market_listings
    ├── field_mls_id            (unused for off-market — the listing's own
    │                            slug is the identity)
    ├── title                   (display address)
    ├── field_property_documents → node--document[]
                                    ├── field_doc_title  (e.g. "Survey")
                                    ├── title            (e.g. "(slug)Survey")
                                    └── field_file       → file--file
                                                            └── attributes.uri.url

Sanity destination: offMarketListing.documents — same propertyDocument
shape we already use on the MLS-side propertyEnhancement schema.

Uses the same omk-<uuid> document IDs that
migrate-off-market-from-drupal.py wrote, so we can patch the documents
array onto the existing Sanity record without touching photos / status /
prices. Re-running is safe — it replaces the documents array each time.

Usage:
  SANITY_API_TOKEN=<write-token> python3 scripts/migrate-off-market-documents-from-drupal.py [--dry-run] [--only 401-carroll] [--limit N]

Flags:
  --dry-run     Print what would change; don't write to Sanity.
  --only SLUG   Only patch the off-market listing whose Drupal title or
                street address contains this substring (case-insensitive).
                Handy when fixing a single listing without re-uploading
                docs for everything.
  --limit N     Stop after N Drupal nodes.

Requires:
  pip3 install requests
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import time
from typing import Any

import requests

DRUPAL_BASE_URL = "https://kcms.foundationcrm.app"
DRUPAL_USERNAME = "or_api_user"
DRUPAL_PASSWORD = "mj6ef-pxaF4CE7W"

SANITY_PROJECT_ID = "ujo0cv7k"
SANITY_DATASET = "production"
SANITY_API_VERSION = "2024-01-01"

DOC_TYPE_PATTERNS: list[tuple[re.Pattern, str]] = [
    (re.compile(r"\bfloor\s*plan", re.I), "floor_plan"),
    (re.compile(r"\bbrochure", re.I), "brochure"),
    (re.compile(r"\bsurvey", re.I), "survey"),
    (re.compile(r"\bdisclosure", re.I), "disclosures"),
    (re.compile(r"\bhoa", re.I), "hoa"),
    (re.compile(r"\binspection", re.I), "inspection"),
]


def classify_doc(title: str) -> str:
    for pat, label in DOC_TYPE_PATTERNS:
        if pat.search(title or ""):
            return label
    return "other"


def clean_title(raw_title: str | None, field_doc_title: str | None) -> str:
    if field_doc_title and field_doc_title.strip():
        return field_doc_title.strip()
    t = (raw_title or "").strip()
    # Strip leading "(...prefix...)" — Drupal often stores titles like "(401-carroll)Floor Plan"
    return re.sub(r"^\([^)]*\)\s*", "", t) or "Document"


drupal = requests.Session()
drupal.auth = (DRUPAL_USERNAME, DRUPAL_PASSWORD)


def drupal_fetch_all() -> tuple[list[dict], dict]:
    """Page through every off-market listing, pulling the property docs
    graph in the same response.
    """
    items: list[dict] = []
    included_by_id: dict[tuple, dict] = {}
    url = (
        f"{DRUPAL_BASE_URL}/jsonapi/node/off_market_listings"
        "?page%5Blimit%5D=50"
        "&include=field_property_documents,field_property_documents.field_file"
    )
    while url:
        resp = drupal.get(url, timeout=60)
        resp.raise_for_status()
        body = resp.json()
        items.extend(body.get("data", []))
        for inc in body.get("included", []):
            included_by_id[(inc["type"], inc["id"])] = inc
        url = body.get("links", {}).get("next", {}).get("href")
    return items, included_by_id


def resolve_documents(node: dict, included: dict) -> list[dict]:
    """
    Walk field_property_documents[] → node--document → field_file → file--file.
    Returns a list of dicts ready to upload to Sanity.
    """
    out: list[dict] = []
    refs = (
        node.get("relationships", {})
            .get("field_property_documents", {})
            .get("data") or []
    )
    for ref in refs:
        doc_node = included.get((ref["type"], ref["id"]))
        if not doc_node:
            continue
        # Skip unpublished sub-documents — they were probably retired
        if not doc_node.get("attributes", {}).get("status", True):
            continue
        a = doc_node.get("attributes", {})
        title = clean_title(a.get("title"), a.get("field_doc_title"))
        file_ref = (
            doc_node.get("relationships", {})
                    .get("field_file", {})
                    .get("data")
        )
        if not file_ref:
            continue
        f = included.get((file_ref["type"], file_ref["id"]))
        if not f:
            continue
        uri = f.get("attributes", {}).get("uri", {})
        href = uri.get("url") if isinstance(uri, dict) else uri
        if not href:
            continue
        if not href.startswith("http"):
            href = f"{DRUPAL_BASE_URL}{href}"
        out.append({
            "title": title,
            "doc_type": classify_doc(title),
            "url": href,
            "filename": f.get("attributes", {}).get("filename") or "document",
            "mime": f.get("attributes", {}).get("filemime") or "application/octet-stream",
        })
    return out


class SanityClient:
    def __init__(self, token: str):
        self.token = token
        self.session = requests.Session()
        self.session.headers.update({"Authorization": f"Bearer {token}"})

    def upload_file(self, url: str, filename: str, mime: str) -> str | None:
        try:
            r = requests.get(url, timeout=180)
            r.raise_for_status()
        except Exception as e:
            print(f"   ✗ download failed: {url} ({e})", file=sys.stderr)
            return None
        api = (
            f"https://{SANITY_PROJECT_ID}.api.sanity.io/"
            f"v{SANITY_API_VERSION}/assets/files/{SANITY_DATASET}"
            f"?filename={requests.utils.quote(filename)}"
        )
        up = self.session.post(
            api,
            data=r.content,
            headers={"Content-Type": mime or "application/octet-stream"},
            timeout=180,
        )
        if up.status_code >= 300:
            print(f"   ✗ Sanity upload {up.status_code}: {up.text[:200]}", file=sys.stderr)
            return None
        return up.json()["document"]["_id"]

    def mutate(self, mutations: list[dict]) -> dict:
        api = (
            f"https://{SANITY_PROJECT_ID}.api.sanity.io/"
            f"v{SANITY_API_VERSION}/data/mutate/{SANITY_DATASET}"
        )
        r = self.session.post(api, json={"mutations": mutations}, timeout=60)
        if r.status_code >= 300:
            raise RuntimeError(f"Sanity mutate failed {r.status_code}: {r.text[:400]}")
        return r.json()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--only", type=str, default=None,
                        help="Substring match on Drupal title / address; "
                             "case-insensitive. Restricts the run to a single listing.")
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    token = os.environ.get("SANITY_API_TOKEN")
    if not args.dry_run and not token:
        print("SANITY_API_TOKEN env var required (unless --dry-run).", file=sys.stderr)
        sys.exit(1)

    print(f"→ Pulling off-market documents from {DRUPAL_BASE_URL}")
    nodes, included = drupal_fetch_all()
    print(f"  Found {len(nodes)} off-market listing(s) in Drupal")

    if args.only:
        needle = args.only.lower()
        nodes = [n for n in nodes if needle in (
            (n.get("attributes", {}).get("title") or "") + " " +
            (n.get("attributes", {}).get("field_street_1") or "")
        ).lower()]
        print(f"  --only {args.only!r}: narrowed to {len(nodes)} listing(s)")

    if args.limit:
        nodes = nodes[: args.limit]

    sanity = SanityClient(token) if not args.dry_run else None
    summary = {"patched": 0, "skipped_no_docs": 0, "files_uploaded": 0, "errors": []}

    for n in nodes:
        a = n["attributes"]
        title = a.get("title") or n["id"]
        is_published = bool(a.get("status"))
        target_id = f"omk-{n['id']}" if is_published else f"drafts.omk-{n['id']}"
        docs = resolve_documents(n, included)

        if not docs:
            summary["skipped_no_docs"] += 1
            continue

        print(f"\n• {title}  ({len(docs)} doc{'s' if len(docs)!=1 else ''})  → {target_id}")
        for d in docs:
            print(f"   - {d['title']}  [{d['doc_type']}]  {d['filename']}")

        if args.dry_run:
            continue

        sanity_docs: list[dict] = []
        for i, d in enumerate(docs):
            asset_id = sanity.upload_file(d["url"], d["filename"], d["mime"])
            if not asset_id:
                summary["errors"].append({"target": target_id, "file": d["filename"]})
                continue
            summary["files_uploaded"] += 1
            sanity_docs.append({
                "_type": "propertyDocument",
                "_key": f"doc-{i:03d}",
                "title": d["title"],
                "documentType": d["doc_type"],
                "file": {
                    "_type": "file",
                    "asset": {"_type": "reference", "_ref": asset_id},
                },
            })
            time.sleep(0.05)

        if not sanity_docs:
            print(f"   ⚠ no files uploaded successfully; skipping patch")
            continue

        try:
            sanity.mutate([{"patch": {"id": target_id, "set": {"documents": sanity_docs}}}])
            summary["patched"] += 1
            print(f"   ✓ patched {target_id} with {len(sanity_docs)} documents")
        except Exception as e:
            print(f"   ✗ patch failed: {e}", file=sys.stderr)
            summary["errors"].append({"target": target_id, "error": str(e)})

    print("\n── Summary ──")
    for k, v in summary.items():
        print(f"  {k}: {v if not isinstance(v, list) else len(v)}")


if __name__ == "__main__":
    main()
