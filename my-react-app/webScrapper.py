import requests
from bs4 import BeautifulSoup
from dateutil import parser as dateparser
import re
import time
import praw
import csv
from datetime import datetime

import praw
import csv
from datetime import datetime
import re

# --- Reddit Setup ---
reddit = praw.Reddit(
    client_id="mqkOL3-DbJ_5uVhra1800w",
    client_secret="o3hE3BIuHuMIMn3SXFFXIGULDY3qjQ",
    user_agent="my_tmobile_sentiment_scraper"
)

subreddit = reddit.subreddit("tmobile")

# --- Scrape Latest Posts ---
posts_data = []

for post in subreddit.new(limit=100):
    created_time = datetime.utcfromtimestamp(post.created_utc).strftime('%Y-%m-%d %H:%M:%S')

    # Clean up post text (remove newlines, excessive spaces, and quotes)
    clean_text = re.sub(r'\s+', ' ', post.selftext).strip()
    clean_text = clean_text.replace('"', "'")

    posts_data.append({
        "Title": post.title.strip(),
        "Date": created_time,
        "Upvotes": post.score,
        "URL": post.url,
        "Text": clean_text[:1000] if clean_text else "(No text provided)"
    })

# --- Save to CSV ---
output_file = "reddit_tmobile_clean.csv"

with open(output_file, mode="w", newline="", encoding="utf-8-sig") as file:
    writer = csv.DictWriter(file, fieldnames=["Title", "Date", "Upvotes", "URL", "Text"])
    writer.writeheader()
    writer.writerows(posts_data)

print(f"✅ Scraped {len(posts_data)} posts and saved clean data to {output_file}")



BASE_URL = "https://www.consumeraffairs.com/cell_phones/tmobile_network.html?page={}"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
OUTPUT_CSV = "tmobile_reviews_combined.csv"
PAGES_TO_SCRAPE = 5


def parse_thanks_count(review_block):
    """Extracts number of 'thanks' or 'helpful' votes."""
    candidates = []
    for tag in review_block.find_all(["button", "a", "span", "div"]):
        txt = (tag.get_text(" ", strip=True) or "").strip()
        if not txt:
            continue
        if re.search(r"\bthanks\b", txt, re.I) or re.search(r"helpful", txt, re.I):
            candidates.append(txt)

    for txt in candidates:
        m = re.search(r"\((\d+)\)", txt)
        if m:
            return int(m.group(1))
        m = re.search(r"(\d+)\s*(people )?(found this helpful|helpful)?", txt, re.I)
        if m:
            return int(m.group(1))

    fallback = review_block.find(attrs={"class": re.compile(r"(thanks|helpful|vote|rvw_thanks|rvw_like)", re.I)})
    if fallback:
        m = re.search(r"(\d+)", fallback.get_text() or "")
        if m:
            return int(m.group(1))

    return 0


def parse_review_date(review_block):
    """Extracts and normalizes review date."""
    time_tag = review_block.find("time")
    if time_tag and time_tag.has_attr("datetime"):
        try:
            dt = dateparser.parse(time_tag["datetime"])
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            return time_tag["datetime"]

    pdt = review_block.find("p", class_=re.compile(r"rvw_rvd-dt|rvw-dt|rvw_rvd", re.I))
    if pdt:
        txt = pdt.get_text(" ", strip=True)
        m = re.search(r"Reviewed\s*[:\-]?\s*(.+)", txt, re.I)
        date_str = m.group(1) if m else txt
        try:
            dt = dateparser.parse(date_str)
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            return date_str

    txt_block = review_block.get_text(" ", strip=True)
    m = re.search(r"Reviewed\s*[:\-]?\s*([A-Za-z0-9,\.\s]+(?:\d{4})?)", txt_block, re.I)
    if m:
        date_str = m.group(1).strip()
        try:
            dt = dateparser.parse(date_str)
            return dt.strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            return date_str
    return ""


def parse_review_text(review_block):
    """Extracts full review text (including hidden parts)."""
    full_text_div = review_block.find("div", class_=re.compile(r"js-collapsed|rvw_all-text|rvw_top-text", re.I))
    if full_text_div:
        text = full_text_div.get_text(" ", strip=True)
        text = re.sub(r"\b(More|Less)\b$", "", text).strip()
        if text:
            return text

    ps = review_block.find_all("p")
    if ps:
        texts = []
        for p in ps:
            pt = p.get_text(" ", strip=True)
            if not pt:
                continue
            if re.search(r"Reviewed\s+", pt, re.I):
                continue
            texts.append(pt)
        combined = " ".join(texts).strip()
        if combined:
            return combined

    return review_block.get_text(" ", strip=True)


def parse_location(review_block):
    """Extracts reviewer location."""
    loc = review_block.find("span", class_=re.compile(r"rvw_inf-lctn", re.I))
    if loc:
        return loc.get_text(strip=True)
    loc2 = review_block.find("span", class_=re.compile(r"lctn|location", re.I))
    if loc2:
        return loc2.get_text(strip=True)
    return ""


def scrape_page(page_number):
    """Scrapes one page and returns list of reviews."""
    url = BASE_URL.format(page_number)
    print(f"Scraping page {page_number} → {url}")

    resp = requests.get(url, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    review_blocks = soup.find_all("div", class_=re.compile(r"\bjs-rvw\b|\brvw\b", re.I))
    results = []

    for rb in review_blocks:
        location = parse_location(rb)
        date = parse_review_date(rb)
        thanks = parse_thanks_count(rb)
        text = parse_review_text(rb)

        # Avoid empty or duplicate content
        key = (location, date, text)
        if not text or key in results:
            continue

        results.append({
            "location": location,
            "date": date,
            "thanks": thanks,
            "text": text
        })

    print(f"  → Found {len(results)} reviews on page {page_number}")
    return results


def scrape_multiple_pages(pages=PAGES_TO_SCRAPE):
    """Scrape multiple pages and deduplicate by text."""
    all_reviews = []
    seen = set()

    for i in range(1, pages + 1):
        try:
            reviews = scrape_page(i)
            for r in reviews:
                key = (r["location"], r["date"], r["text"])
                if key not in seen:
                    seen.add(key)
                    all_reviews.append(r)
            time.sleep(1.5)
        except Exception as e:
            print(f"⚠️ Error scraping page {i}: {e}")

    return all_reviews


if __name__ == "__main__":
    all_data = scrape_multiple_pages(PAGES_TO_SCRAPE)
    print(f"\n✅ Total unique reviews scraped: {len(all_data)}")

    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["location", "date", "thanks", "text"])
        writer.writeheader()
        writer.writerows(all_data)

    print(f"💾 Saved to {OUTPUT_CSV}")
