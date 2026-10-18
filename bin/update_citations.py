#!/usr/bin/env python3
"""Update _data/citations.yml with Google Scholar citation counts.

Reads Paul Sharp's Google Scholar profile (scholar_userid in _config.yml) and records the
"Cited by" count for each article, keyed by its Scholar article id (the google_scholar_id
field in the .bib files). The papers page shows these counts next to each entry.

Run by .github/workflows/update-citations.yml every week, or by hand:  python3 bin/update_citations.py

If Google Scholar can't be reached or blocks the request, the file is left unchanged, so the
site keeps showing the last known counts. The file is only rewritten when a count changes.
"""

import datetime
import html
import re
import sys
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "_config.yml"
DATA = ROOT / "_data" / "citations.yml"
PAGE_SIZE = 100
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/124.0 Safari/537.36"
)


def scholar_user_id():
    match = re.search(r"^scholar_userid:\s*([A-Za-z0-9_-]+)", CONFIG.read_text(), flags=re.M)
    if not match:
        sys.exit("scholar_userid not found in _config.yml")
    return match.group(1)


def fetch_counts(user):
    """Return {article_id: citation_count} for every article on the profile."""
    counts = {}
    start = 0
    while True:
        url = f"https://scholar.google.com/citations?user={user}&hl=en&cstart={start}&pagesize={PAGE_SIZE}"
        request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept-Language": "en"})
        with urllib.request.urlopen(request, timeout=30) as response:
            page = response.read().decode("utf-8", errors="ignore")
        rows = re.findall(r'<tr class="gsc_a_tr">(.*?)</tr>', page, flags=re.S)
        for row in rows:
            article = re.search(r"citation_for_view=[^:\"]+:([^\"&]+)\"", row)
            cited = re.search(r'class="gsc_a_ac gs_ibl"[^>]*>(\d*)</a>', row)
            if article:
                counts[html.unescape(article.group(1))] = int(cited.group(1)) if cited and cited.group(1) else 0
        if len(rows) < PAGE_SIZE:
            return counts
        start += PAGE_SIZE
        time.sleep(2)


def read_existing():
    counts = {}
    if DATA.exists():
        for key, value in re.findall(r"^\s+'([^']+)':\s*(\d+)\s*$", DATA.read_text(), flags=re.M):
            counts[key] = int(value)
    return counts


def write(counts):
    lines = [
        "# Google Scholar citation counts, keyed by Scholar article id (google_scholar_id in the .bib files).",
        "# Updated automatically by .github/workflows/update-citations.yml via bin/update_citations.py.",
        f"updated: {datetime.date.today().isoformat()}",
        "counts:",
    ]
    for key, value in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0])):
        lines.append(f"  '{key}': {value}")
    DATA.write_text("\n".join(lines) + "\n")


def main():
    try:
        fetched = fetch_counts(scholar_user_id())
    except Exception as error:  # network error, block or captcha page
        print(f"Could not fetch Google Scholar ({error.__class__.__name__}: {error}); keeping existing counts.")
        return
    if not fetched:
        print("No articles found on the Scholar page (possibly blocked); keeping existing counts.")
        return
    existing = read_existing()
    merged = {**existing, **fetched}
    if merged == existing:
        print(f"Citation counts unchanged ({len(merged)} articles).")
        return
    write(merged)
    changed = {k: (existing.get(k), v) for k, v in merged.items() if existing.get(k) != v}
    print(f"Updated {len(changed)} of {len(merged)} citation counts: {changed}")


if __name__ == "__main__":
    main()
