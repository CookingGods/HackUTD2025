import praw
import csv
from datetime import datetime

reddit = praw.Reddit(
    client_id="mqkOL3-DbJ_5uVhra1800w",
    client_secret="o3hE3BIuHuMIMn3SXFFXIGULDY3qjQ",
    user_agent="my_tmobile_sentiment_scraper"
)

subreddit = reddit.subreddit("tmobile")

posts_data = []

for post in subreddit.new(limit=100):
    created_time = datetime.utcfromtimestamp(post.created_utc).strftime('%Y-%m-%d %H:%M:%S')
    posts_data.append({
        "title": post.title,
        "date": created_time,
        "upvotes": post.score,
        "url": post.url,
        "text": post.selftext[:1000]  # optional: include preview text
    })

# --- Write to CSV ---
with open("reddit_text.csv", mode="w", newline="", encoding="utf-8") as file:
    writer = csv.DictWriter(file, fieldnames=["title", "date", "upvotes", "url", "text"])
    writer.writeheader()
    writer.writerows(posts_data)

print(f"Scraped {len(posts_data)} posts and saved to reddit_text.csv")
