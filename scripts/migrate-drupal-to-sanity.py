#!/usr/bin/env python3
"""
Migration script: Drupal CMS -> Sanity CMS
Pulls all blog posts from Drupal JSON API and pushes them to Sanity.

Usage:
  python3 scripts/migrate-drupal-to-sanity.py <SANITY_WRITE_TOKEN>
"""

import sys
import json
import re
import hashlib
import time
import requests
from html.parser import HTMLParser
from urllib.parse import urljoin

# Force unbuffered output
sys.stdout.reconfigure(line_buffering=True) if hasattr(sys.stdout, 'reconfigure') else None

# ── Configuration ──────────────────────────────────────────────────────────────

DRUPAL_BASE_URL = "https://kcms.foundationcrm.app"
DRUPAL_USERNAME = "or_api_user"
DRUPAL_PASSWORD = "mj6ef-pxaF4CE7W"

SANITY_PROJECT_ID = "ujo0cv7k"
SANITY_DATASET = "production"
SANITY_API_VERSION = "2024-01-01"

# ── HTML to Portable Text Converter ───────────────────────────────────────────

class HTMLToPortableText(HTMLParser):
    """Converts HTML content to Sanity Portable Text blocks."""

    def __init__(self):
        super().__init__()
        self.blocks = []
        self.current_block = None
        self.current_marks = []
        self.current_children = []
        self.list_type = None
        self.list_level = 0
        self.in_list_item = False
        self.link_href = None
        self.mark_annotations = []
        self.block_key_counter = 0
        self.images = []

    def _generate_key(self):
        self.block_key_counter += 1
        return f"block{self.block_key_counter:04d}"

    def _flush_block(self, style="normal", list_item=None, level=None):
        if self.current_children:
            block = {
                "_type": "block",
                "_key": self._generate_key(),
                "style": style,
                "markDefs": list(self.mark_annotations),
                "children": list(self.current_children),
            }
            if list_item:
                block["listItem"] = list_item
                block["level"] = level or 1
            self.blocks.append(block)
        self.current_children = []
        self.mark_annotations = []

    def _add_text(self, text):
        if not text:
            return
        span = {
            "_type": "span",
            "_key": self._generate_key(),
            "text": text,
            "marks": list(self.current_marks),
        }
        self.current_children.append(span)

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)

        if tag in ("h1", "h2", "h3", "h4"):
            self._flush_block()

        elif tag == "p":
            self._flush_block()

        elif tag == "blockquote":
            self._flush_block()

        elif tag in ("strong", "b"):
            self.current_marks.append("strong")

        elif tag in ("em", "i"):
            self.current_marks.append("em")

        elif tag == "a":
            href = attrs_dict.get("href", "")
            if href:
                mark_key = self._generate_key()
                self.mark_annotations.append({
                    "_type": "link",
                    "_key": mark_key,
                    "href": href,
                })
                self.current_marks.append(mark_key)
                self.link_href = mark_key

        elif tag == "ul":
            self._flush_block()
            self.list_type = "bullet"
            self.list_level += 1

        elif tag == "ol":
            self._flush_block()
            self.list_type = "number"
            self.list_level += 1

        elif tag == "li":
            self._flush_block()
            self.in_list_item = True

        elif tag == "img":
            src = attrs_dict.get("src", "")
            alt = attrs_dict.get("alt", "")
            if src:
                self.images.append({"src": src, "alt": alt})

        elif tag == "br":
            self._add_text("\n")

    def handle_endtag(self, tag):
        if tag in ("h1", "h2", "h3", "h4"):
            self._flush_block(style=tag)

        elif tag == "p":
            self._flush_block()

        elif tag == "blockquote":
            self._flush_block(style="blockquote")

        elif tag in ("strong", "b"):
            if "strong" in self.current_marks:
                self.current_marks.remove("strong")

        elif tag in ("em", "i"):
            if "em" in self.current_marks:
                self.current_marks.remove("em")

        elif tag == "a":
            if self.link_href and self.link_href in self.current_marks:
                self.current_marks.remove(self.link_href)
            self.link_href = None

        elif tag in ("ul", "ol"):
            self._flush_block()
            self.list_level -= 1
            if self.list_level <= 0:
                self.list_type = None
                self.list_level = 0

        elif tag == "li":
            self._flush_block(
                list_item=self.list_type or "bullet",
                level=self.list_level,
            )
            self.in_list_item = False

    def handle_data(self, data):
        text = data
        if text.strip() or text == " ":
            self._add_text(text)

    def handle_entityref(self, name):
        char_map = {
            "nbsp": "\u00a0",
            "amp": "&",
            "lt": "<",
            "gt": ">",
            "quot": '"',
            "rsquo": "\u2019",
            "lsquo": "\u2018",
            "rdquo": "\u201d",
            "ldquo": "\u201c",
            "mdash": "\u2014",
            "ndash": "\u2013",
            "hellip": "\u2026",
        }
        self._add_text(char_map.get(name, f"&{name};"))

    def handle_charref(self, name):
        try:
            if name.startswith("x"):
                char = chr(int(name[1:], 16))
            else:
                char = chr(int(name))
            self._add_text(char)
        except (ValueError, OverflowError):
            self._add_text(f"&#{name};")

    def get_result(self):
        self._flush_block()
        # Filter out empty blocks
        result = []
        for block in self.blocks:
            children = block.get("children", [])
            has_content = any(
                child.get("text", "").strip() for child in children
            )
            if has_content:
                result.append(block)
        return result


def html_to_portable_text(html_content):
    """Convert HTML string to Sanity Portable Text format."""
    if not html_content:
        return []
    parser = HTMLToPortableText()
    parser.feed(html_content)
    return parser.get_result(), parser.images


def slugify(text):
    """Generate a URL-safe slug from text."""
    slug = text.lower().strip()
    slug = re.sub(r"[^\w\s-]", "", slug)
    slug = re.sub(r"[-\s]+", "-", slug)
    slug = slug.strip("-")
    return slug[:96]


# ── Drupal API Client ─────────────────────────────────────────────────────────

def fetch_all_drupal_posts():
    """Fetch all blog posts from Drupal JSON API with pagination."""
    posts = []
    url = f"{DRUPAL_BASE_URL}/jsonapi/node/post?page%5Blimit%5D=50"

    while url:
        print(f"  Fetching page ({len(posts)} posts so far)...")
        response = requests.get(
            url,
            auth=(DRUPAL_USERNAME, DRUPAL_PASSWORD),
            timeout=60,
        )
        response.raise_for_status()
        data = response.json()

        page_posts = data.get("data", [])
        posts.extend(page_posts)

        next_link = data.get("links", {}).get("next")
        if next_link:
            url = next_link.get("href") if isinstance(next_link, dict) else next_link
        else:
            url = None

    return posts


def fetch_image_url_for_post(post):
    """Fetch the featured image file URL for a Drupal post."""
    img_rel = post.get("relationships", {}).get("field_blog_featured_image", {}).get("data")
    if not img_rel:
        return None

    file_id = img_rel.get("id")
    if not file_id:
        return None

    try:
        url = f"{DRUPAL_BASE_URL}/jsonapi/file/file/{file_id}"
        response = requests.get(url, auth=(DRUPAL_USERNAME, DRUPAL_PASSWORD), timeout=15)
        response.raise_for_status()
        data = response.json()
        uri = data.get("data", {}).get("attributes", {}).get("uri", {})
        if isinstance(uri, dict):
            return uri.get("url")
        return None
    except Exception as e:
        print(f"    Warning: Could not fetch image info: {e}")
        return None


def get_image_url(post):
    """Extract the featured image URL from a Drupal post via file API (S3)."""
    # Prefer Drupal file API which returns S3 URLs
    drupal_url = fetch_image_url_for_post(post)
    if drupal_url:
        if not drupal_url.startswith("http"):
            drupal_url = urljoin(DRUPAL_BASE_URL, drupal_url)
        return drupal_url

    return None


# ── Sanity API Client ─────────────────────────────────────────────────────────

class SanityClient:
    def __init__(self, project_id, dataset, token, api_version="2024-01-01"):
        self.project_id = project_id
        self.dataset = dataset
        self.token = token
        self.api_version = api_version
        self.base_url = f"https://{project_id}.api.sanity.io/v{api_version}"

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    def create_or_replace(self, document):
        """Create or replace a document in Sanity."""
        url = f"{self.base_url}/data/mutate/{self.dataset}"
        payload = {
            "mutations": [
                {"createOrReplace": document}
            ]
        }
        response = requests.post(url, json=payload, headers=self._headers(), timeout=30)
        if response.status_code != 200:
            print(f"    Error: {response.status_code} - {response.text[:200]}")
        response.raise_for_status()
        return response.json()

    def upload_image(self, image_url):
        """Download an image from URL and upload to Sanity."""
        try:
            img_response = requests.get(image_url, timeout=30, stream=True)
            img_response.raise_for_status()

            content_type = img_response.headers.get("content-type", "image/jpeg")
            upload_url = f"https://{self.project_id}.api.sanity.io/v{self.api_version}/assets/images/{self.dataset}"

            upload_response = requests.post(
                upload_url,
                headers={
                    "Authorization": f"Bearer {self.token}",
                    "Content-Type": content_type,
                },
                data=img_response.content,
                timeout=60,
            )
            upload_response.raise_for_status()
            result = upload_response.json()
            asset_id = result.get("document", {}).get("_id")
            if asset_id:
                return {"_type": "image", "asset": {"_type": "reference", "_ref": asset_id}}
        except Exception as e:
            print(f"    Warning: Failed to upload image {image_url[:60]}... - {e}")

        return None


# ── Migration Logic ───────────────────────────────────────────────────────────

def convert_drupal_post_to_sanity(post, sanity_client):
    """Convert a Drupal post to a Sanity document."""
    attrs = post.get("attributes", {})
    title = attrs.get("title", "Untitled")
    slug = attrs.get("field_url_slug") or slugify(title)
    date = attrs.get("field_date") or attrs.get("created")

    # Parse HTML body to Portable Text
    body_html = ""
    body_field = attrs.get("field_blog_content", {})
    if isinstance(body_field, dict):
        body_html = body_field.get("value", "") or body_field.get("processed", "")
    elif isinstance(body_field, str):
        body_html = body_field

    portable_text, inline_images = html_to_portable_text(body_html)

    # Generate a deterministic document ID from slug
    doc_id = f"drupal-post-{hashlib.md5(slug.encode()).hexdigest()[:12]}"

    doc = {
        "_id": doc_id,
        "_type": "post",
        "title": title,
        "slug": {"_type": "slug", "current": slug},
        "publishedAt": date,
        "body": portable_text,
    }

    # Upload featured image
    image_url = get_image_url(post)
    if image_url:
        if not image_url.startswith("http"):
            image_url = urljoin(DRUPAL_BASE_URL, image_url)
        print(f"    Uploading featured image...")
        image_ref = sanity_client.upload_image(image_url)
        if image_ref:
            doc["image"] = image_ref

    return doc


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/migrate-drupal-to-sanity.py <SANITY_WRITE_TOKEN>")
        print("\nGet a token from: https://www.sanity.io/manage")
        print(f"  Project: {SANITY_PROJECT_ID}")
        print(f"  Dataset: {SANITY_DATASET}")
        print("  Required permissions: Editor or higher")
        sys.exit(1)

    sanity_token = sys.argv[1]

    print("=" * 60)
    print("Drupal -> Sanity Blog Post Migration")
    print("=" * 60)
    print(f"Source: {DRUPAL_BASE_URL}")
    print(f"Target: Sanity project {SANITY_PROJECT_ID}/{SANITY_DATASET}")
    print()

    # Step 1: Fetch all posts from Drupal
    print("[1/3] Fetching posts from Drupal...")
    drupal_posts = fetch_all_drupal_posts()
    print(f"  Found {len(drupal_posts)} posts\n")

    if not drupal_posts:
        print("No posts found. Exiting.")
        sys.exit(0)

    # Step 2: Initialize Sanity client
    print("[2/3] Connecting to Sanity...")
    sanity = SanityClient(SANITY_PROJECT_ID, SANITY_DATASET, sanity_token)

    # Step 3: Convert and push each post
    print(f"[3/3] Migrating {len(drupal_posts)} posts...\n")
    success_count = 0
    error_count = 0

    for i, post in enumerate(drupal_posts, 1):
        title = post.get("attributes", {}).get("title", "Untitled")
        print(f"  [{i}/{len(drupal_posts)}] {title[:60]}...")

        try:
            sanity_doc = convert_drupal_post_to_sanity(post, sanity)
            sanity.create_or_replace(sanity_doc)
            success_count += 1
            print(f"    OK")
        except Exception as e:
            error_count += 1
            print(f"    FAILED: {e}")

        # Small delay to avoid rate limiting
        if i % 10 == 0:
            time.sleep(0.5)

    print()
    print("=" * 60)
    print(f"Migration complete!")
    print(f"  Successful: {success_count}")
    print(f"  Failed:     {error_count}")
    print(f"  Total:      {len(drupal_posts)}")
    print(f"\nView in Sanity Studio: https://klug-foundation.vercel.app/studio")
    print("=" * 60)


if __name__ == "__main__":
    main()
