from openai import OpenAI
import os
import re
os.environ["OMP_NUM_THREADS"] = "1"
from sklearn.cluster import KMeans
import pandas as pd
from dotenv import load_dotenv
import requests
from tqdm import tqdm

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

def combining_file():
    file_reddit = 'reddit_text.csv'
    file_tmobile = 'tmobile_reviews.csv'
    output_file = 'combined_data.csv'

    COLUMN_MAPPING_REDDIT = {
        'text': 'text',      
        'upvotes': 'score',   
        'url': 'url',        
        'date': 'date'
    }


    COLUMN_MAPPING_TMOBILE = {
        'location': 'location',
        'review': 'text',    
        'thanks': 'score',
        'date': 'date'
    }

    try:
        df_reddit = pd.read_csv(file_reddit)
        df_tmobile = pd.read_csv(file_tmobile)

        print(f"Loaded '{file_reddit}'. Columns: {df_reddit.columns.to_list()}")
        print(f"Loaded '{file_tmobile}'. Columns: {df_tmobile.columns.to_list()}")

        df_reddit_std = df_reddit.rename(columns=COLUMN_MAPPING_REDDIT)
        df_reddit_std = df_reddit_std[COLUMN_MAPPING_REDDIT.values()]
        
        df_tmobile_std = df_tmobile.rename(columns=COLUMN_MAPPING_TMOBILE)
        df_tmobile_std = df_tmobile_std[COLUMN_MAPPING_TMOBILE.values()]

        combined_df = pd.concat([df_reddit_std, df_tmobile_std], ignore_index=True, sort=False)

        combined_df.to_csv(output_file, index=False)

        print(f"\n✅ Successfully combined files and saved to '{output_file}'")
        print("\n--- Combined Data Info ---")
        combined_df.info()
        print("\n--- First 5 Rows ---")
        print(combined_df.head())
        print("\n--- Last 5 Rows ---")
        print(combined_df.tail())

    except FileNotFoundError as e:
        print(f"❌ ERROR: File not found.")
        print(f"Details: {e}")
        print("Please make sure both CSV files are in the same directory as the script.")

    except KeyError as e:
        print(f"❌ ERROR: A column name in your mapping was not found in the CSV.")
        print(f"Column not found: {e}")
        print("Please update the 'COLUMN_MAPPING_...' dictionaries to match your CSV headers exactly.")

    except Exception as e:
        print(f"An unexpected error occurred: {e}")

api_key = os.getenv("NVIDIA_API_KEY")
if not api_key:
    raise EnvironmentError("ERROR: NVIDIA_API_KEY environment variable not set.")

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=api_key
)

def get_location_from_text(text_content: str) -> str | None:
    """
    Uses the NVIDIA API to extract a location from a text.
    Returns the location string or None if not found.
    """
    
    system_prompt = (
        "You are an expert entity extraction system. "
        "Your task is to read the user's text and reply with *only* the specific state abbreviation where the post is likely from"
        "If no specific location is mentioned, you MUST reply with the single word: N/A"
    )

    try:
        response = client.chat.completions.create(
            model="qwen/qwen3-next-80b-a3b-instruct",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": text_content}
            ],
            temperature=0.0, 
            max_tokens=50    
        )
        
        result = response.choices[0].message.content.strip()

        if result.lower() == 'n/a' or result.lower() == 'none' or result == "":
            return None
        
        return result.replace('"', '').replace("'", "")

    except Exception as e:
        print(f"  [API Error: {e}]")
        return None

def process_csv_locations(input_file: str, output_file: str):
    print(f"Loading '{input_file}'...")
    try:
        df = pd.read_csv(input_file)
    except FileNotFoundError:
        print(f"ERROR: Input file '{input_file}' not found.")
        return

    if 'text' not in df.columns:
        print(f"ERROR: No 'text' column found in '{input_file}'. Please check your CSV.")
        return

    if 'location' not in df.columns:
        print("Creating 'location' column...")
        df['location'] = pd.NA
    else:
        df['location'] = df['location'].replace('', pd.NA)

    rows_to_process = df[df['location'].isna()]
    
    if len(rows_to_process) == 0:
        print("No rows found with missing locations. All done!")
        return

    print(f"Found {len(rows_to_process)} rows with missing locations. Starting API calls...")

    for index, row in tqdm(rows_to_process.iterrows(), total=len(rows_to_process)):
        text = row['text']
        
        if not isinstance(text, str) or not text.strip():
            continue
            
        extracted_location = get_location_from_text(text)
        
        if extracted_location:
            df.at[index, 'location'] = extracted_location

    print(f"\nProcessing complete. Saving to '{output_file}'...")
    df.to_csv(output_file, index=False)
    print("✅ Done.")

def get_dates_from_text(date: str) -> str | None:
    system_prompt = (
        "You are an expert entity extraction system. "
        "Your task is to read the user's text and reply with *only* the specific date mentioned in the format month/day/year like 11/9/2025. "
        "If no date is mentioned, you MUST reply with the single word: N/A."
    )

    try:
        response = client.chat.completions.create(
            model="qwen/qwen3-next-80b-a3b-instruct",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": date}
            ],
            temperature=0.0,
            max_tokens=50
        )

        result = response.choices[0].message.content.strip()

        if result.lower() in ['n/a', 'none', '']:
            return None

        return result.replace('"', '').replace("'", "")

    except Exception as e:
        print(f"[API Error: {e}]")
        return None


if __name__ == "__main__":
    tqdm.pandas()

    df = pd.read_csv("tmobile_reviews_labeled.csv")

    # Apply your function to the date column with a progress bar
    df["date"] = df["date"].progress_apply(lambda x: get_dates_from_text(str(x)))

    # Drop rows with no valid date
    df = df.dropna(subset=["date"])

    # Save cleaned version (avoid overwriting original)
    df.to_csv("tmobile_reviews_labeled_cleaned.csv", index=False)

    # api_key = os.getenv("NVIDIA_API_KEY")
    # base_url = "https://integrate.api.nvidia.com/v1"

    # reviews = pd.read_csv("combined_data_with_locations.csv")
    # reviews = reviews.dropna(subset=['text'])
    # reviews = reviews.reset_index(drop=True)
    # texts = reviews["text"].tolist()

    # embs = []
    # batch_size = 16
    # headers = {"Authorization": f"Bearer {api_key}"}

    # for i in tqdm(range(0, len(texts), batch_size), desc="Generating Embeddings"):
    #     batch = texts[i:i + batch_size]
    #     payload = {
    #         "model": "nvidia/llama-3.2-nemoretriever-300m-embed-v2",
    #         "input": batch,
    #         "input_type": "passage"
    #     }
    #     r = requests.post(f"{base_url}/embeddings", headers=headers, json=payload)
    #     r.raise_for_status()
    #     embs.extend([item["embedding"] for item in r.json()["data"]])

    # kmeans = KMeans(n_clusters=10, n_init=10, random_state=42)
    # topics = kmeans.fit_predict(embs)

    # topic_labels = {}
    # for i in set(topics):
    #     cluster_texts = [texts[j] for j in range(len(texts)) if topics[j] == i]
    #     topic_labels[i] = name_topic(cluster_texts)


    # sentiments = [classify_sentiment(t) for t in tqdm(texts, desc="Classifying Sentiments")]

    # reviews["topic_id"] = topics
    # reviews["topic_name"] = [topic_labels[t] for t in topics]
    # reviews["sentiment"] = sentiments

    # reviews.to_csv("tmobile_reviews_labeled.csv", index=False)

    # print("✅ Processing complete! Saved to 'tmobile_reviews_labeled.csv'")
