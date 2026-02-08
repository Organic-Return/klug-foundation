#!/usr/bin/env python3
"""
SEO Optimization Script for Sanity Blog Posts
Reads all posts, generates optimized meta titles, descriptions, and keywords,
then patches each post's SEO fields.

Usage:
  python3 scripts/seo-optimize-posts.py <SANITY_WRITE_TOKEN>
"""

import sys
import json
import re
import time
import requests

sys.stdout.reconfigure(line_buffering=True) if hasattr(sys.stdout, 'reconfigure') else None

# ── Configuration ──────────────────────────────────────────────────────────────

SANITY_PROJECT_ID = "ujo0cv7k"
SANITY_DATASET = "production"
SANITY_API_VERSION = "2024-01-01"

# Brand suffix for meta titles
BRAND_SUFFIX = " | Klug Properties"
MAX_TITLE_LENGTH = 60
MAX_DESC_LENGTH = 160

# Common SEO keyword mappings for Aspen real estate content
KEYWORD_PATTERNS = {
    r'\baspen\b': 'Aspen',
    r'\bsnowmass\b': 'Snowmass',
    r'\broaring fork\b': 'Roaring Fork Valley',
    r'\breal estate\b': 'real estate',
    r'\bmarket\b': 'market update',
    r'\bski(ing)?\b': 'skiing',
    r'\bmountain\b': 'mountain living',
    r'\bhik(e|ing)\b': 'hiking',
    r'\bbik(e|ing)\b': 'biking',
    r'\btrail(s)?\b': 'trails',
    r'\bdining\b': 'dining',
    r'\brestaurant(s)?\b': 'restaurants',
    r'\bevent(s)?\b': 'events',
    r'\bwinter\b': 'winter activities',
    r'\bsummer\b': 'summer activities',
    r'\bspring\b': 'spring',
    r'\bfall\b': 'fall',
    r'\bx.?games?\b': 'X Games',
    r'\bfood.{0,5}wine\b': 'Food & Wine',
    r'\bsnow\b': 'snow sports',
    r'\bgolf\b': 'golf',
    r'\bfly.?fish\b': 'fly fishing',
    r'\bluxury\b': 'luxury',
    r'\bcondo(minium)?s?\b': 'condominiums',
    r'\bhome(s)?\b': 'homes',
    r'\bproperty\b': 'property',
    r'\binvestment\b': 'investment',
    r'\blistings?\b': 'listings',
    r'\bbuying\b': 'buying',
    r'\bselling\b': 'selling',
    r'\bcarbondale\b': 'Carbondale',
    r'\bbasalt\b': 'Basalt',
    r'\bglenwood\b': 'Glenwood Springs',
    r'\bviceroy\b': 'Viceroy Snowmass',
    r'\baprès\b': 'après ski',
    r'\bwinterskol\b': 'Winterskol',
    r'\bmusic\b': 'live music',
    r'\bcommunity\b': 'community',
    r'\boutdoor(s)?\b': 'outdoor activities',
}


# ── Helpers ────────────────────────────────────────────────────────────────────

def extract_plain_text(body_blocks):
    """Extract plain text from Sanity Portable Text blocks."""
    if not body_blocks:
        return ""

    texts = []
    for block in body_blocks:
        if block.get("_type") != "block":
            continue
        children = block.get("children", [])
        for child in children:
            text = child.get("text", "")
            if text:
                texts.append(text)

    return " ".join(texts)


def generate_meta_title(title):
    """Generate an SEO-optimized meta title (max 60 chars with brand)."""
    if not title:
        return "Aspen Snowmass Blog | Klug Properties"

    # Clean up the title
    clean_title = title.strip()

    # If title + brand fits, use it
    full = clean_title + BRAND_SUFFIX
    if len(full) <= MAX_TITLE_LENGTH:
        return full

    # Truncate title to fit brand suffix
    max_title_part = MAX_TITLE_LENGTH - len(BRAND_SUFFIX)
    if max_title_part < 20:
        # Brand suffix too long, just use title truncated
        return clean_title[:MAX_TITLE_LENGTH]

    # Truncate at word boundary
    truncated = clean_title[:max_title_part].rsplit(" ", 1)[0]
    if len(truncated) < 15:
        truncated = clean_title[:max_title_part]

    return truncated + BRAND_SUFFIX


def generate_meta_description(title, plain_text):
    """Generate an SEO-optimized meta description (max 160 chars)."""
    if not plain_text:
        return f"Read about {title} on the Klug Properties blog. Aspen Snowmass real estate, lifestyle, and community insights."

    # Remove the title if it appears at the start of the body (common pattern)
    text = plain_text.strip()
    if text.lower().startswith(title.lower()):
        text = text[len(title):].strip()
        # Remove leading punctuation
        text = re.sub(r'^[\s\-:,]+', '', text).strip()

    # Clean up whitespace
    text = re.sub(r'\s+', ' ', text).strip()

    if not text:
        return f"Read about {title} on the Klug Properties blog. Aspen Snowmass real estate, lifestyle, and community insights."

    # Truncate to ~155 chars at sentence or word boundary
    if len(text) <= MAX_DESC_LENGTH:
        return text

    # Try to end at a sentence within limit
    truncated = text[:MAX_DESC_LENGTH]

    # Look for sentence ending
    for end_char in ['. ', '! ', '? ']:
        last_sentence = truncated.rfind(end_char)
        if last_sentence > 80:  # Only if we have enough content
            return truncated[:last_sentence + 1].strip()

    # Fall back to word boundary
    truncated = truncated.rsplit(' ', 1)[0]

    # Add ellipsis if we truncated
    if len(truncated) > MAX_DESC_LENGTH - 3:
        truncated = truncated[:MAX_DESC_LENGTH - 3]
        truncated = truncated.rsplit(' ', 1)[0]

    return truncated.rstrip('.,;:-') + "..."


def extract_keywords(title, plain_text, max_keywords=6):
    """Extract relevant SEO keywords from content."""
    combined = f"{title} {plain_text}".lower()
    found_keywords = set()

    for pattern, keyword in KEYWORD_PATTERNS.items():
        if re.search(pattern, combined, re.IGNORECASE):
            found_keywords.add(keyword)

    # Prioritize: location keywords first, then topic keywords
    location_keywords = {'Aspen', 'Snowmass', 'Roaring Fork Valley', 'Carbondale', 'Basalt', 'Glenwood Springs'}
    topic_keywords = found_keywords - location_keywords
    location_found = found_keywords & location_keywords

    # Build final list: locations first, then topics
    result = sorted(location_found) + sorted(topic_keywords)

    # Always include at least "Aspen" if no location found
    if not location_found and 'Aspen' not in result:
        result.insert(0, 'Aspen')

    return result[:max_keywords]


# ── Sanity API ─────────────────────────────────────────────────────────────────

class SanityClient:
    def __init__(self, project_id, dataset, token):
        self.project_id = project_id
        self.dataset = dataset
        self.token = token
        self.base_url = f"https://{project_id}.api.sanity.io/v{SANITY_API_VERSION}"

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    def query(self, groq_query):
        """Run a GROQ query."""
        url = f"https://{self.project_id}.api.sanity.io/v{SANITY_API_VERSION}/data/query/{self.dataset}"
        params = {"query": groq_query}
        response = requests.get(url, params=params, headers=self._headers(), timeout=30)
        response.raise_for_status()
        return response.json().get("result", [])

    def patch(self, doc_id, set_fields):
        """Patch a document with set fields."""
        url = f"{self.base_url}/data/mutate/{self.dataset}"
        payload = {
            "mutations": [
                {
                    "patch": {
                        "id": doc_id,
                        "set": set_fields,
                    }
                }
            ]
        }
        response = requests.post(url, json=payload, headers=self._headers(), timeout=30)
        if response.status_code != 200:
            print(f"    Error: {response.status_code} - {response.text[:200]}")
        response.raise_for_status()
        return response.json()


# ── Main ───────────────────────────────────────────────────────────────────────

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/seo-optimize-posts.py <SANITY_WRITE_TOKEN>")
        sys.exit(1)

    token = sys.argv[1]

    print("=" * 60)
    print("SEO Optimization for Blog Posts")
    print("=" * 60)
    print(f"Project: {SANITY_PROJECT_ID}/{SANITY_DATASET}")
    print()

    sanity = SanityClient(SANITY_PROJECT_ID, SANITY_DATASET, token)

    # Fetch all posts
    print("[1/2] Fetching all posts from Sanity...")
    posts = sanity.query("""
        *[_type == "post"] | order(publishedAt desc) {
            _id,
            title,
            slug,
            publishedAt,
            body,
            seo
        }
    """)
    print(f"  Found {len(posts)} posts\n")

    if not posts:
        print("No posts found. Exiting.")
        sys.exit(0)

    # Process each post
    print(f"[2/2] Optimizing SEO for {len(posts)} posts...\n")
    updated = 0
    skipped = 0
    errors = 0

    for i, post in enumerate(posts, 1):
        title = post.get("title", "Untitled")
        doc_id = post["_id"]

        print(f"  [{i}/{len(posts)}] {title[:55]}...")

        try:
            # Extract plain text from body
            plain_text = extract_plain_text(post.get("body", []))

            # Generate SEO fields
            meta_title = generate_meta_title(title)
            meta_description = generate_meta_description(title, plain_text)
            keywords = extract_keywords(title, plain_text)

            # Build SEO patch
            seo_patch = {
                "seo.metaTitle": meta_title,
                "seo.metaDescription": meta_description,
                "seo.keywords": keywords,
                "seo.noIndex": False,
            }

            sanity.patch(doc_id, seo_patch)
            updated += 1

            # Show what was generated
            print(f"    Title: {meta_title}")
            print(f"    Desc:  {meta_description[:80]}...")
            print(f"    Keys:  {', '.join(keywords)}")

        except Exception as e:
            errors += 1
            print(f"    FAILED: {e}")

        # Rate limiting
        if i % 15 == 0:
            time.sleep(0.5)

    print()
    print("=" * 60)
    print(f"SEO Optimization Complete!")
    print(f"  Updated:  {updated}")
    print(f"  Errors:   {errors}")
    print(f"  Total:    {len(posts)}")
    print()
    print("What was optimized for each post:")
    print("  - Meta Title: Concise title (max 60 chars) with brand suffix")
    print("  - Meta Description: Content summary (max 160 chars)")
    print("  - Keywords: Up to 6 relevant tags (locations + topics)")
    print("  - noIndex: Set to false (all posts indexable)")
    print(f"\nView in Studio: https://klug-foundation.vercel.app/studio")
    print("=" * 60)


if __name__ == "__main__":
    main()
