#!/usr/bin/env python3
"""
Migrate property enhancements (documents) from the legacy Drupal CMS into
Sanity propertyEnhancement records.

Drupal stores per-MLS supplementary docs under node--property_documents:
  property_documents
    ├── field_mls_id           (string, the MLS#)
    ├── title                  (display name, often just the MLS#)
    ├── status                 (Drupal published flag)
    └── field_documents[]      → node--document
                                   ├── field_doc_title  e.g. "Floor Plan"
                                   ├── title            e.g. "(175532)Floor Plan"
                                   └── field_file       → file--file
                                                            └── attributes.uri.url

Sanity destination: schemaType `propertyEnhancement` keyed by mlsNumber.
We upsert one Sanity doc per MLS# with the full documents[] array, doing a
lookup first so an editor-created enhancement (which probably already
holds videos) is patched rather than overwritten.

Usage:
  SANITY_API_TOKEN=<write-token> python3 scripts/migrate-property-enhancements-from-drupal.py [--dry-run] [--limit N]

Flags:
  --dry-run   Print what would change; don't write to Sanity.
  --limit N   Stop after N Drupal nodes.

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

# ── Drupal source ─────────────────────────────────────────────────────────────
DRUPAL_BASE_URL = "https://kcms.foundationcrm.app"
DRUPAL_USERNAME = "or_api_user"
DRUPAL_PASSWORD = "mj6ef-pxaF4CE7W"

# ── Sanity target ─────────────────────────────────────────────────────────────
SANITY_PROJECT_ID = "ujo0cv7k"
SANITY_DATASET = "production"
SANITY_API_VERSION = "2024-01-01"

# ── Heuristic doc-type mapping (Drupal title → Sanity documentType enum) ──────
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
    """
    Drupal stores doc titles like `(175532)Land Use Analysis`. Prefer
    field_doc_title (already clean), and as a fallback strip the
    `(mls#)` prefix off the node title.
    """
    if field_doc_title and field_doc_title.strip():
        return field_doc_title.strip()
    t = (raw_title or "").strip()
    return re.sub(r"^\(\d+\)\s*", "", t) or "Document"


# ── Drupal client ─────────────────────────────────────────────────────────────
drupal = requests.Session()
drupal.auth = (DRUPAL_USERNAME, DRUPAL_PASSWORD)


def drupal_fetch_all() -> tuple[list[dict], dict]:
    """Page through /jsonapi/node/property_documents pulling the full graph
    we need (the property doc → its documents → each document's file).
    """
    items: list[dict] = []
    included_by_id: dict[tuple, dict] = {}
    url = (
        f"{DRUPAL_BASE_URL}/jsonapi/node/property_documents"
        "?page%5Blimit%5D=50"
        "&include=field_documents,field_documents.field_file"
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
    Walk node.relationships.field_documents[] → node--document, then
    that document's field_file → file--file. Return one dict per
    document containing title, doc_type, file URL, filename, mime.
    Skips unpublished sub-documents.
    """
    out: list[dict] = []
    refs = (
        node.get("relationships", {})
            .get("field_documents", {})
            .get("data") or []
    )
    for ref in refs:
        doc_node = included.get((ref["type"], ref["id"]))
        if not doc_node:
            continue
        if not doc_node.get("attributes", {}).get("status", True):
            continue  # skip unpublished sub-docs
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


# ── Sanity client ─────────────────────────────────────────────────────────────
class SanityClient:
    def __init__(self, token: str):
        self.token = token
        self.session = requests.Session()
        self.session.headers.update({"Authorization": f"Bearer {token}"})

    def upload_file(self, url: str, filename: str, mime: str) -> str | None:
        """Stream the file from `url`, push to Sanity files endpoint, return asset _id."""
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

    def query(self, groq: str, params: dict | None = None) -> Any:
        api = (
            f"https://{SANITY_PROJECT_ID}.api.sanity.io/"
            f"v{SANITY_API_VERSION}/data/query/{SANITY_DATASET}"
        )
        r = self.session.get(api, params={"query": groq, **(params or {})}, timeout=30)
        r.raise_for_status()
        return r.json().get("result")

    def find_enhancement_id(self, mls_number: str) -> str | None:
        """Return the _id of an existing propertyEnhancement for this MLS#, if any."""
        result = self.query(
            '*[_type == "propertyEnhancement" && mlsNumber == $mls][0]._id',
            {"$mls": f'"{mls_number}"'},  # GROQ params via querystring need json-encoded values
        )
        return result if isinstance(result, str) else None

    def mutate(self, mutations: list[dict]) -> dict:
        api = (
            f"https://{SANITY_PROJECT_ID}.api.sanity.io/"
            f"v{SANITY_API_VERSION}/data/mutate/{SANITY_DATASET}"
        )
        r = self.session.post(api, json={"mutations": mutations}, timeout=60)
        if r.status_code >= 300:
            raise RuntimeError(f"Sanity mutate failed {r.status_code}: {r.text[:400]}")
        return r.json()


# ── Main ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    token = os.environ.get("SANITY_API_TOKEN")
    if not args.dry_run and not token:
        print("SANITY_API_TOKEN env var required (unless --dry-run).", file=sys.stderr)
        sys.exit(1)

    print(f"→ Pulling property enhancements from {DRUPAL_BASE_URL}")
    nodes, included = drupal_fetch_all()
    print(f"  Found {len(nodes)} property_documents node(s) in Drupal")

    # Group by MLS# in case Drupal has multiple property_documents nodes
    # for the same listing.
    by_mls: dict[str, dict] = {}
    for n in nodes:
        a = n["attributes"]
        if not a.get("status"):
            # Skip unpublished parent nodes
            continue
        mls = (a.get("field_mls_id") or "").strip()
        if not mls:
            continue
        docs = resolve_documents(n, included)
        if not docs:
            continue
        entry = by_mls.setdefault(mls, {"title": a.get("title") or mls, "docs": []})
        entry["docs"].extend(docs)

    if args.limit:
        keys = list(by_mls.keys())[: args.limit]
        by_mls = {k: by_mls[k] for k in keys}

    print(f"  → {len(by_mls)} unique MLS#(s) with at least one document")

    sanity = SanityClient(token) if not args.dry_run else None
    summary = {"created": 0, "patched": 0, "files_uploaded": 0, "errors": []}

    for mls, payload in by_mls.items():
        docs = payload["docs"]
        print(f"\n• MLS#{mls}  ({len(docs)} doc{'s' if len(docs)!=1 else ''})")
        for d in docs:
            print(f"   - {d['title']}  [{d['doc_type']}]  {d['filename']}")

        if args.dry_run:
            continue

        # Upload every file first
        sanity_docs: list[dict] = []
        for i, d in enumerate(docs):
            asset_id = sanity.upload_file(d["url"], d["filename"], d["mime"])
            if not asset_id:
                summary["errors"].append({"mls": mls, "file": d["filename"]})
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
            time.sleep(0.05)  # be gentle

        if not sanity_docs:
            print(f"   ⚠ no files uploaded successfully for MLS#{mls}; skipping mutate")
            continue

        # Decide whether to create new or patch existing
        existing_id = sanity.find_enhancement_id(mls)
        if existing_id:
            # Patch: replace the documents[] array entirely (idempotent re-runs)
            mutations = [{
                "patch": {
                    "id": existing_id,
                    "set": {"documents": sanity_docs},
                },
            }]
            try:
                sanity.mutate(mutations)
                summary["patched"] += 1
                print(f"   ✓ patched existing propertyEnhancement {existing_id}")
            except Exception as e:
                print(f"   ✗ patch failed: {e}", file=sys.stderr)
                summary["errors"].append({"mls": mls, "error": str(e)})
        else:
            doc_id = f"prop-enh-{mls}"
            doc = {
                "_id": doc_id,
                "_type": "propertyEnhancement",
                "mlsNumber": mls,
                "documents": sanity_docs,
            }
            try:
                sanity.mutate([{"createOrReplace": doc}])
                summary["created"] += 1
                print(f"   ✓ created propertyEnhancement {doc_id}")
            except Exception as e:
                print(f"   ✗ create failed: {e}", file=sys.stderr)
                summary["errors"].append({"mls": mls, "error": str(e)})

    print("\n── Summary ──")
    for k, v in summary.items():
        print(f"  {k}: {v if not isinstance(v, list) else len(v)}")


if __name__ == "__main__":
    main()
