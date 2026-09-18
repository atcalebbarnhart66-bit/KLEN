#!/usr/bin/env python3
"""Fetch recent external news matching KLEN's configured keywords and write
_data/external_news.yml.

Run automatically by .github/workflows/fetch-external-news.yml on a
schedule. Uses Google News RSS (no API key required). Only writes
title/source/date/link -- never full article text or a summary -- since
this is a link-out aggregator, not a republisher.

To change what gets pulled in, edit KEYWORDS below. To change how many
articles are kept, edit MAX_ITEMS. See README.md for the full explanation
of how this pipeline fits into the site.

Each run MERGES freshly fetched articles into whatever is already in
_data/external_news.yml, rather than replacing it outright -- Google
News RSS only returns recent results, so without this an article would
silently vanish from the site a few days after it ran, even though the
News page paginates and implies older ones are still browsable. The
merged archive is capped at MAX_ITEMS so it doesn't grow forever.
"""
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

KEYWORDS = [
    "Kansas sheriff",
    "Kansas police department",
    "Kansas law enforcement",
    "Kansas highway patrol",
]

MAX_ITEMS = 60
OUTPUT_PATH = "_data/external_news.yml"
REQUEST_TIMEOUT = 20
USER_AGENT = "KLEN-news-fetch/1.0 (+https://github.com/atcalebbarnhart66-bit/KLEN)"

TAG_RE = re.compile(r"<[^>]+>")


def fetch_feed(query: str) -> bytes:
    url = "https://news.google.com/rss/search?" + urllib.parse.urlencode({
        "q": query,
        "hl": "en-US",
        "gl": "US",
        "ceid": "US:en",
    })
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=REQUEST_TIMEOUT) as resp:
        return resp.read()


def strip_html(text: str) -> str:
    return TAG_RE.sub("", text or "").strip()


def parse_items(xml_bytes: bytes, keyword: str) -> list:
    root = ET.fromstring(xml_bytes)
    items = []
    for item in root.findall("./channel/item"):
        title = (item.findtext("title") or "").strip()
        link = (item.findtext("link") or "").strip()
        pub_date_raw = (item.findtext("pubDate") or "").strip()

        source_el = item.find("source")
        source = (source_el.text or "").strip() if source_el is not None else ""

        if not title or not link:
            continue

        items.append({
            "title": title,
            "url": link,
            "source": source,
            "pub_date_raw": pub_date_raw,
            # Google News RSS's <description> is not a real article
            # summary -- it's just the headline and source name again,
            # HTML-formatted. There's nothing worth extracting from it, so
            # this feed intentionally has no excerpt field. A future
            # source that provides real summaries could add one back.
            "matched_keyword": keyword,
        })
    return items


def parse_rfc822(date_str: str):
    if not date_str:
        return None
    for fmt in ("%a, %d %b %Y %H:%M:%S %Z", "%a, %d %b %Y %H:%M:%S %z"):
        try:
            dt = datetime.strptime(date_str, fmt)
        except ValueError:
            continue
        # %Z ("GMT", which is what Google News RSS always sends) parses
        # the text but does NOT attach tzinfo, unlike %z -- normalize both
        # cases to UTC-aware so every datetime in this script compares
        # safely against every other one.
        return dt if dt.tzinfo else dt.replace(tzinfo=timezone.utc)
    return None


def parse_iso_date(date_str: str):
    """Parses the plain YYYY-MM-DD format this script stores in
    `published`, used when re-sorting an archived entry pulled back in
    by load_existing() that has no raw RSS pubDate to re-parse."""
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def yaml_escape(value: str) -> str:
    return (value or "").replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ").strip()


def yaml_unescape(value: str) -> str:
    return value.replace('\\"', '"').replace("\\\\", "\\")


ENTRY_FIELD_RE = re.compile(r'^\s*-?\s*(\w+):\s*"(.*)"\s*$')


def load_existing(path: str) -> dict:
    """Parse this script's own previously-written output. This format is
    fully controlled by build_yaml() below, so a small line-based reader
    is enough -- no YAML library dependency needed in the CI runner."""
    if not os.path.exists(path):
        return {}

    items = {}
    current = None
    with open(path, "r") as f:
        for line in f:
            if line.strip().startswith("#") or not line.strip():
                continue
            match = ENTRY_FIELD_RE.match(line)
            if not match:
                continue
            key, raw_value = match.group(1), yaml_unescape(match.group(2))
            if key == "title":
                current = {"title": raw_value}
            elif current is not None and key in ("url", "source", "published", "matched_keyword"):
                current[key] = raw_value
                if key == "matched_keyword" and current.get("url"):
                    items[current["url"]] = current
    return items


def build_yaml(parsed: list) -> str:
    lines = [
        "# _data/external_news.yml",
        "#",
        "# AUTO-GENERATED by scripts/fetch_external_news.py -- do not hand-edit.",
        "# Rebuilt on a schedule by .github/workflows/fetch-external-news.yml",
        "# against Google News RSS, for the keywords configured at the top of",
        "# that script. These are external articles KLEN did not write, did",
        "# not verify, and does not endorse -- the News page renders them",
        "# with that disclaimer attached. See README.md for how to change the",
        "# keyword list, the schedule, or turn this off entirely.",
        f"# Last fetched: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        "",
    ]

    for item in parsed:
        dt = item["_dt"]
        published = dt.strftime("%Y-%m-%d") if dt.year > 1 else ""
        lines.append(f"- title: \"{yaml_escape(item['title'])}\"")
        lines.append(f"  url: \"{yaml_escape(item['url'])}\"")
        lines.append(f"  source: \"{yaml_escape(item['source'])}\"")
        lines.append(f"  published: \"{published}\"")
        lines.append(f"  matched_keyword: \"{yaml_escape(item['matched_keyword'])}\"")
        lines.append("")

    return "\n".join(lines)


def main() -> int:
    all_items = load_existing(OUTPUT_PATH)
    existing_count = len(all_items)
    had_success = False

    for keyword in KEYWORDS:
        try:
            xml_bytes = fetch_feed(keyword)
        except (urllib.error.URLError, TimeoutError) as exc:
            print(f"WARN: failed to fetch for '{keyword}': {exc}", file=sys.stderr)
            continue

        try:
            items = parse_items(xml_bytes, keyword)
        except ET.ParseError as exc:
            print(f"WARN: failed to parse feed for '{keyword}': {exc}", file=sys.stderr)
            continue

        had_success = True
        for item in items:
            # A fresh fetch overwrites a stale archive entry for the same
            # URL (picks up a corrected title, etc.); an archived entry
            # not seen again today is kept as-is, not dropped.
            all_items[item["url"]] = item

    if not had_success and existing_count == 0:
        print("ERROR: every keyword fetch failed and there is no existing archive; nothing to write.", file=sys.stderr)
        return 1
    if not had_success:
        print(f"WARN: every keyword fetch failed; keeping the existing {existing_count} archived articles unchanged.", file=sys.stderr)

    parsed = list(all_items.values())
    for item in parsed:
        if "_dt" not in item:
            raw = item.get("pub_date_raw") or item.get("published") or ""
            item["_dt"] = (
                parse_rfc822(raw)
                or parse_iso_date(raw)
                or datetime.min.replace(tzinfo=timezone.utc)
            )

    parsed.sort(key=lambda x: x["_dt"], reverse=True)
    parsed = parsed[:MAX_ITEMS]

    with open(OUTPUT_PATH, "w") as f:
        f.write(build_yaml(parsed))

    print(f"Wrote {len(parsed)} external articles to {OUTPUT_PATH} ({existing_count} carried over, merged with today's fetch)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
