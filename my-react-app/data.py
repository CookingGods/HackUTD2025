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
        # FIX 1: Increase max_tokens to prevent truncation
        max_tokens=15, 
    )

    # Get the raw response and make it lowercase
    raw_name = response.choices[0].message.content.lower()

    # 1. Get ONLY the first line of the response
    first_line = raw_name.split('\n')[0]
    
    # 2. CRITICAL FIX: Strip whitespace (like " ") from the ends of *that* line
    stripped_line = first_line.strip()
    
    # 3. Now, replace any internal spaces with underscores (e.g., "customer service" -> "customer_service")
    with_underscores = stripped_line.replace(" ", "_")
    
    # 4. Remove any junk characters (like punctuation) that aren't letters, numbers, or _
    cleaned_name = re.sub(r'[^a-z0-9_]', '', with_underscores)
    
    # 5. Final cleanup: Remove any leading or trailing underscores (fixes "support_")
    topic_name = cleaned_name.strip('_')

    # Removed the de-duplication 'if' block
    return topic_name



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
        max_tokens=1,
    )

    sentiment = response.choices[0].message.content.strip()
    return sentiment


api_key=os.getenv("NVIDIA_API_KEY")
base_url="https://integrate.api.nvidia.com/v1"
# 1. Get data
#texts = fetch_news_and_tweets_about("T-Mobile")
texts = [
    "T-Mobile’s 5G network has been super fast lately!",
    "Customer support took forever to respond.",
    "I switched from Verizon to T-Mobile and saved money.",
    "Their coverage in rural areas still needs work.",
    "T-Mobile’s customer service has really improved this year.",
    "I love the new Magenta Max plan, it’s worth the upgrade.",
    "Sometimes the signal drops when I travel out of state.",
    "Their unlimited data plan actually feels unlimited!",
    "T-Mobile Tuesdays always have great deals and freebies.",
    "The 5G coverage in my city is incredibly consistent.",
    "Switching to T-Mobile was a smooth and easy process.",
    "I’ve had trouble getting good reception inside buildings.",
    "Their international roaming options are a lifesaver when traveling abroad.",
    "The mobile app could use a better design — it’s a bit clunky.",
    "T-Mobile’s prices are fair compared to other carriers.",
    "Customer support reps were very patient and helpful.",
    "The connection speed slows down a bit during peak hours.",
    "I appreciate how transparent T-Mobile is with their billing.",
    "They offer great family plan discounts and bundles.",
    "Coverage in mountain areas could still be better.",
    "I’ve noticed fewer dropped calls since switching to T-Mobile.",
    "The free Netflix subscription with my plan is a nice bonus.",
    "Their 5G home internet works surprisingly well for streaming.",
    "T-Mobile’s network upgrade in my area made a huge difference."
]


# 2. Create embeddings
embs = []
for t in texts:
    payload = {
        "model": "nvidia/llama-3.2-nemoretriever-300m-embed-v2",
        "input": [t],
        "input_type": "passage"
    }
    headers = {"Authorization": f"Bearer {api_key}"}
    r = requests.post(f"{base_url}/embeddings", headers=headers, json=payload)
    r.raise_for_status()
    embs.append(r.json()["data"][0]["embedding"])

# 3. Cluster into topics
kmeans = KMeans(n_clusters=min(6, len(embs)), n_init=10)
topics = kmeans.fit_predict(embs)

topic_labels = {}
for i in set(topics):
    cluster_texts = [texts[j] for j in range(len(texts)) if topics[j] == i]
    topic_labels[i] = name_topic(cluster_texts)

# 4. Run sentiment model
sentiments = [classify_sentiment(t) for t in texts]  # could use LLM or fine-tuned model

# 5. Combine results
df = pd.DataFrame({
    "text": texts,
    "topic_id": topics,
    "topic_name": [topic_labels[t] for t in topics],
    "sentiment": sentiments
})

print(df)
