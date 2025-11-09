from openai import OpenAI
import os
import re
os.environ["OMP_NUM_THREADS"] = "1"
from sklearn.cluster import KMeans
import pandas as pd
from dotenv import load_dotenv
import requests

load_dotenv()

def name_topic(texts_in_cluster: list[str]) -> str:
    client = OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=os.getenv("NVIDIA_API_KEY"))

    joined_texts = "\n".join(texts_in_cluster[:5])

    prompt = f"""
    You are labeling short texts about T-Mobile customer experiences.
    Give a short, specific, single-word label that best describes the shared topic of these texts.
    The next word you say will be the label, so do not include any context.
    
    Avoid generic words like 'T-Mobile', 'cellphone', 'network', or 'service'.
    Instead, focus on meaningful topics like 'coverage', 'speed', 'pricing', 'support', 'reliability', 'plans', etc.
    
    Example good labels: coverage, cost, customer_service, reliability, speed, promotions.
    Example bad labels: T-Mobile, phone, network, general_feedback.
    
    Texts:
    {joined_texts}
    """

    response = client.chat.completions.create(
        model="meta/llama-3.1-8b-instruct",
        messages=[
            {"role": "system", "content": "You are a topic labeling assistant for T-Mobile user feedback. Reply with one short word only — the most specific topic name possible."},
            {"role": "user", "content": prompt},
        ],
        temperature=0.0,
        max_tokens=15,
    )

    raw_name = response.choices[0].message.content.lower().split('\n')[0].strip()
    cleaned = re.sub(r'[^a-z0-9_ ]', '', raw_name).replace(" ", "_").strip('_')

    if not cleaned or len(cleaned) < 2:
        cleaned = "misc"

    return cleaned


def classify_sentiment(text: str) -> str:
    client = OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=os.getenv("NVIDIA_API_KEY"))

    response = client.chat.completions.create(
        model="qwen/qwen3-next-80b-a3b-instruct",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a sentiment analysis assistant. "
                    "Your job is to classify text as Positive, Negative, or Neutral. "
                    "Reply with only one of these words — nothing else."
                ),
            },
            {"role": "user", "content": text},
        ],
        temperature=0.0,
        max_tokens=5,
    )

    sentiment = response.choices[0].message.content.strip().capitalize()
    if sentiment not in ["Positive", "Negative", "Neutral"]:
        sentiment = "Neutral"

    return sentiment


if __name__ == "__main__":
    api_key = os.getenv("NVIDIA_API_KEY")
    base_url = "https://integrate.api.nvidia.com/v1"

    reviews = pd.read_csv("../tmobile_reviews_combined.csv")
    texts = reviews["text"].tolist()

    embs = []
    batch_size = 16
    headers = {"Authorization": f"Bearer {api_key}"}

    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        payload = {
            "model": "nvidia/llama-3.2-nemoretriever-300m-embed-v2",
            "input": batch,
            "input_type": "passage"
        }
        r = requests.post(f"{base_url}/embeddings", headers=headers, json=payload)
        r.raise_for_status()
        embs.extend([item["embedding"] for item in r.json()["data"]])

    kmeans = KMeans(n_clusters=min(6, len(embs)), n_init=10, random_state=42)
    topics = kmeans.fit_predict(embs)

    topic_labels = {}
    for i in set(topics):
        cluster_texts = [texts[j] for j in range(len(texts)) if topics[j] == i]
        topic_labels[i] = name_topic(cluster_texts)

    sentiments = [classify_sentiment(t) for t in texts]

    reviews["topic_id"] = topics
    reviews["topic_name"] = [topic_labels[t] for t in topics]
    reviews["sentiment"] = sentiments

    reviews.to_csv("../tmobile_reviews_labeled.csv", index=False)

    print("✅ Processing complete! Saved to '../tmobile_reviews_labeled.csv'")
