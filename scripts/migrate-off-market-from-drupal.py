#!/usr/bin/env python3
"""
Migrate off-market listings from the legacy Drupal CMS into Sanity.

The script paginates /jsonapi/node/off_market_listings, downloads every
attached image, uploads them as Sanity assets, and writes one Sanity
offMarketListing document per Drupal node.

Drupal's published/unpublished flag is preserved into Sanity:
  - Drupal published   → Sanity document at  omk-<uuid>          (live, public)
  - Drupal unpublished → Sanity document at  drafts.omk-<uuid>   (draft, hidden from public)

Each run is a transaction per node that creates/replaces the doc at the
correct id AND removes the document at the opposite id, so a record
flipping from published to unpublished (or vice versa) in Drupal lands
cleanly on the Sanity side without leaving a stale shadow behind.

Usage:
  SANITY_API_TOKEN=<write-token> python3 scripts/migrate-off-market-from-drupal.py [--dry-run] [--limit N]

Flags:
  --dry-run   Print what would change; don't write anything to Sanity.
  --limit N   Stop after processing N Drupal nodes (handy for testing).

Requires:
  pip3 install requests
"""

from __future__ import annotations

import argparse
import os
import re
import sys
import time
import unicodedata
from html.parser import HTMLParser
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

# ── HTML → plain text helper ──────────────────────────────────────────────────
class HtmlStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self.chunks: list[str] = []
        self.skip_depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style", "o:p"):
            self.skip_depth += 1
        elif tag in ("p", "br", "div", "li"):
            self.chunks.append("\n")

    def handle_endtag(self, tag):
        if tag in ("script", "style", "o:p") and self.skip_depth > 0:
            self.skip_depth -= 1
        elif tag in ("p", "div", "li"):
            self.chunks.append("\n")

    def handle_data(self, data):
        if self.skip_depth == 0:
            self.chunks.append(data)


def html_to_text(html: str | None) -> str | None:
    if not html:
        return None
    s = HtmlStripper()
    s.feed(html)
    text = "".join(s.chunks)
    # collapse whitespace
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n[ \t]+", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip() or None


def slugify(value: str) -> str:
    value = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    value = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return re.sub(r"-+", "-", value)


# ── Field coercion helpers ────────────────────────────────────────────────────
def to_int(v: Any) -> int | None:
    if v is None or v == "":
        return None
    try:
        return int(float(str(v)))
    except (TypeError, ValueError):
        return None


def to_float(v: Any) -> float | None:
    if v is None or v == "":
        return None
    try:
        return float(str(v))
    except (TypeError, ValueError):
        return None


def to_bool(v: Any) -> bool:
    if isinstance(v, bool):
        return v
    if isinstance(v, str):
        return v.strip().lower() in {"yes", "true", "1"}
    return bool(v)


def to_list(v: Any) -> list[str] | None:
    if not v:
        return None
    if isinstance(v, list):
        return [str(x).strip() for x in v if str(x).strip()]
    parts = re.split(r"[;,]\s*", str(v))
    cleaned = [p.strip() for p in parts if p.strip()]
    return cleaned or None


# ── Drupal client ─────────────────────────────────────────────────────────────
drupal = requests.Session()
drupal.auth = (DRUPAL_USERNAME, DRUPAL_PASSWORD)


def drupal_fetch_all_listings() -> tuple[list[dict], dict]:
    """Page through /jsonapi/node/off_market_listings and collect every record,
    published AND unpublished. The Drupal `status` attribute is preserved on
    each item so the caller can decide whether to write a published Sanity
    doc or a draft."""
    items: list[dict] = []
    included_by_id: dict[str, dict] = {}
    # ?filter[status][value]=... is omitted on purpose — we want both states.
    # Drupal's JSON:API returns unpublished nodes for authenticated requests
    # with sufficient permission, which our or_api_user account has.
    url = (
        f"{DRUPAL_BASE_URL}/jsonapi/node/off_market_listings"
        "?page%5Blimit%5D=25"
        "&include=field_images,field_images.field_media_image,field_images.thumbnail"
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


def resolve_image_urls(node: dict, included: dict) -> list[str]:
    """
    Walk node.relationships.field_images[] → media--image → field_media_image
    → file--file → attributes.uri.url. Returns absolute URLs in their original
    Drupal order.
    """
    urls: list[str] = []
    media_refs = (
        node.get("relationships", {})
            .get("field_images", {})
            .get("data") or []
    )
    for ref in media_refs:
        media = included.get((ref["type"], ref["id"]))
        if not media:
            continue
        file_ref = (
            media.get("relationships", {})
                 .get("field_media_image", {})
                 .get("data")
        )
        if not file_ref:
            continue
        file_node = included.get((file_ref["type"], file_ref["id"]))
        if not file_node:
            continue
        uri = file_node.get("attributes", {}).get("uri", {})
        href = uri.get("url") if isinstance(uri, dict) else uri
        if not href:
            continue
        # If the URL is already absolute (Drupal sometimes stores S3 URLs
        # directly), use it as-is; otherwise prefix the Drupal base.
        if href.startswith("http"):
            urls.append(href)
        else:
            urls.append(f"{DRUPAL_BASE_URL}{href}")
    return urls


# ── Sanity client (thin) ──────────────────────────────────────────────────────
class SanityClient:
    def __init__(self, token: str):
        self.token = token
        self.session = requests.Session()
        self.session.headers.update({
            "Authorization": f"Bearer {token}",
        })

    def upload_image(self, url: str) -> str | None:
        """Download from `url`, upload to Sanity, return asset _id."""
        try:
            r = requests.get(url, timeout=120)
            r.raise_for_status()
        except Exception as e:
            print(f"   ✗ download failed: {url} ({e})", file=sys.stderr)
            return None
        # Guess content-type from URL
        ext = url.rsplit(".", 1)[-1].lower().split("?", 1)[0]
        ctype = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "webp": "image/webp",
            "gif": "image/gif",
        }.get(ext, "application/octet-stream")
        api = (
            f"https://{SANITY_PROJECT_ID}.api.sanity.io/"
            f"v{SANITY_API_VERSION}/assets/images/{SANITY_DATASET}"
        )
        up = self.session.post(api, data=r.content, headers={"Content-Type": ctype}, timeout=120)
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


# ── Doc builder ───────────────────────────────────────────────────────────────
def build_doc(node: dict, image_asset_ids: list[str]) -> dict:
    uuid = node["id"]
    a = node["attributes"]

    title = a.get("title") or "Untitled Listing"

    address = a.get("field_street_1") or ""
    if a.get("field_street_2"):
        address = f"{address} {a['field_street_2']}".strip()

    # Slug: prefer address + city, fall back to title.
    base = address or title
    if a.get("field_off_city"):
        base = f"{base} {a['field_off_city']}"
    slug = slugify(base)[:90] or f"listing-{uuid[:8]}"

    desc_value = (a.get("field_off_description") or {}).get("value") if isinstance(a.get("field_off_description"), dict) else None
    description = html_to_text(desc_value)

    fireplaces = to_int(a.get("field_fireplaces"))
    inclusions_list = (
        to_list(a.get("field_inclusions"))
        or to_list(a.get("field_extras"))
    )

    listing_date = a.get("created")
    if isinstance(listing_date, str):
        listing_date = listing_date[:10]

    doc: dict[str, Any] = {
        "_id": f"omk-{uuid}",
        "_type": "offMarketListing",
        "title": title,
        "slug": {"_type": "slug", "current": slug},
        "status": "Active",
        "listPrice": to_int(a.get("field_price")),
        "propertyType": a.get("field_subtype") or a.get("field_type"),
        "listingDate": listing_date,
        "address": address or None,
        "city": a.get("field_off_city"),
        "state": a.get("field_off_state"),
        "zipCode": a.get("field_postal_code"),
        "subdivisionName": a.get("field_subdivision") or a.get("field_neighborhood"),
        "mlsAreaMinor": a.get("field_major_area"),
        "latitude": to_float(a.get("field_off_latitude")),
        "longitude": to_float(a.get("field_off_longitude")),
        "bedrooms": to_int(a.get("field_bedrooms")),
        "bathroomsFull": to_int(a.get("field_full_bathrooms")),
        "bathroomsThreeQuarter": to_int(a.get("field_three_quarter_bathrooms")),
        "bathroomsHalf": to_int(a.get("field_half_bathrooms")),
        "squareFeet": to_int(a.get("field_square_footage")),
        "lotSize": to_float(a.get("field_lot_acreage")) or to_float(a.get("field_lot_size")),
        "yearBuilt": to_int(a.get("field_year_built")),
        "description": description,
        "furnished": a.get("field_furnished"),
        "fireplaceYn": bool(fireplaces and fireplaces > 0),
        "fireplaceTotal": fireplaces,
        "fireplaceFeatures": to_list(a.get("field_fireplace_type")),
        "cooling": ["Cooling"] if to_bool(a.get("field_cooling")) else None,
        "heating": ["Heating"] if to_bool(a.get("field_heating")) else None,
        "laundryFeatures": to_list(a.get("field_laundry")),
        "attachedGarageYn": to_bool(a.get("field_garage")),
        "parkingFeatures": to_list(a.get("field_parking_features")),
        "associationAmenities": inclusions_list,
        "virtualTourUrl": a.get("field_virtual_tour_link"),
        "videoUrl": a.get("field_property_video_link"),
        "requiresRegistration": True,
        "featured": False,
        "publishedAt": listing_date,
    }

    # Images: first one is featured, rest go to the photos gallery.
    if image_asset_ids:
        doc["featuredImage"] = {
            "_type": "image",
            "asset": {"_type": "reference", "_ref": image_asset_ids[0]},
        }
        doc["photos"] = [
            {
                "_type": "image",
                "_key": f"img-{i:03d}",
                "asset": {"_type": "reference", "_ref": aid},
            }
            for i, aid in enumerate(image_asset_ids[1:])
        ]

    # Strip None values so Sanity doesn't store nulls
    return {k: v for k, v in doc.items() if v is not None}


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

    print(f"→ Pulling off-market listings from {DRUPAL_BASE_URL}")
    nodes, included = drupal_fetch_all_listings()
    published_count = sum(1 for n in nodes if n.get("attributes", {}).get("status"))
    unpublished_count = len(nodes) - published_count
    print(
        f"  Found {len(nodes)} listing(s): "
        f"{published_count} published, {unpublished_count} unpublished"
    )

    if args.limit:
        nodes = nodes[: args.limit]
        print(f"  Limiting to first {len(nodes)} for this run")

    sanity = SanityClient(token) if not args.dry_run else None
    summary = {
        "published_written": 0,
        "drafts_written": 0,
        "images_uploaded": 0,
        "errors": [],
    }

    for n in nodes:
        attrs = n["attributes"]
        title = attrs.get("title") or n["id"]
        is_published = bool(attrs.get("status"))
        state_label = "PUBLISHED" if is_published else "draft (unpublished)"
        urls = resolve_image_urls(n, included)
        print(f"\n• [{state_label}] {title}  ({len(urls)} image{'s' if len(urls)!=1 else ''})")

        if args.dry_run:
            asset_ids = []  # no upload in dry-run
        else:
            asset_ids = []
            for url in urls:
                aid = sanity.upload_image(url)
                if aid:
                    asset_ids.append(aid)
                    summary["images_uploaded"] += 1
                time.sleep(0.05)  # gentle on Sanity

        doc = build_doc(n, asset_ids)
        base_id = doc["_id"]  # always "omk-<uuid>" from build_doc
        target_id = base_id if is_published else f"drafts.{base_id}"
        opposite_id = f"drafts.{base_id}" if is_published else base_id
        doc["_id"] = target_id

        if args.dry_run:
            print(f"  → would write Sanity doc at: {target_id}")
            print(f"     would remove stale doc at: {opposite_id} (if present)")
            print(f"     slug={doc.get('slug', {}).get('current')}  price=${doc.get('listPrice')}")
            print(f"     beds={doc.get('bedrooms')}  baths={doc.get('bathroomsFull')}  sqft={doc.get('squareFeet')}")
            if is_published:
                summary["published_written"] += 1
            else:
                summary["drafts_written"] += 1
            continue

        # Single transaction: createOrReplace at the correct id, and delete
        # any stale doc at the opposite id (lenient via query — succeeds with
        # zero matches, so flipping state never errors out).
        mutations = [
            {"createOrReplace": doc},
            {"delete": {"query": f'*[_id == "{opposite_id}"]'}},
        ]
        try:
            sanity.mutate(mutations)
            if is_published:
                summary["published_written"] += 1
            else:
                summary["drafts_written"] += 1
            print(f"  ✓ Sanity doc upserted at: {target_id}")
        except Exception as e:
            print(f"  ✗ mutate failed: {e}", file=sys.stderr)
            summary["errors"].append({"id": target_id, "error": str(e)})

    print("\n── Summary ──")
    for k, v in summary.items():
        print(f"  {k}: {v if not isinstance(v, list) else len(v)}")


if __name__ == "__main__":
    main()
