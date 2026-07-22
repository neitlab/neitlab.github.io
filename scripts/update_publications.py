from scholarly import scholarly
import json
from pathlib import Path

SCHOLAR_ID = "MUR-nokAAAAJ"
OUTPUT_PATH = Path("data/publications.json")


def safe_year(value):
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def slugify(text):
    return (
        text.lower()
        .replace(" ", "-")
        .replace(":", "")
        .replace(",", "")
        .replace(".", "")
        .replace("/", "-")
        .replace("(", "")
        .replace(")", "")
    )[:100]


def build_publication_entry(pub):
    bib = pub.get("bib", {})

    title = bib.get("title", "Untitled")
    authors = bib.get("author", "")

    venue = (
        bib.get("journal")
        or bib.get("conference")
        or bib.get("booktitle")
        or bib.get("publisher")
        or ""
    )

    year = bib.get("pub_year", "")

    author_pub_id = pub.get("author_pub_id", "")
    link = (
        f"https://scholar.google.com/citations?view_op=view_citation&citation_for_view={author_pub_id}"
        if author_pub_id
        else ""
    )

    venue_l = str(venue).lower()
    pub_type = ""
    if "conference" in venue_l or "proceedings" in venue_l or "symposium" in venue_l:
        pub_type = "Conference paper"
    elif venue:
        pub_type = "Journal article"

    return {
        "id": slugify(title),
        "title": title,
        "authors": authors,
        "venue": venue,
        "year": year,
        "type": pub_type,
        "link": link
    }


def main():
    print(f"Fetching Scholar profile by ID: {SCHOLAR_ID}")
    author = scholarly.search_author_id(SCHOLAR_ID)
    author_filled = scholarly.fill(author, sections=["publications"])

    publications = []
    raw_pubs = author_filled.get("publications", [])

    print(f"Found {len(raw_pubs)} publications. Fetching detailed metadata...")

    for i, pub in enumerate(raw_pubs, start=1):
        try:
            detailed_pub = scholarly.fill(pub)
            publications.append(build_publication_entry(detailed_pub))
            print(f"[{i}/{len(raw_pubs)}] Added: {detailed_pub.get('bib', {}).get('title', 'Untitled')}")
        except Exception as exc:
            print(f"[{i}/{len(raw_pubs)}] Skipping one publication due to error: {exc}")

    publications.sort(key=lambda item: safe_year(item.get("year")), reverse=True)

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUTPUT_PATH.open("w", encoding="utf-8") as f:
      json.dump(publications, f, indent=2, ensure_ascii=False)

    print(f"Updated {OUTPUT_PATH} with {len(publications)} publications.")


if __name__ == "__main__":
    main()