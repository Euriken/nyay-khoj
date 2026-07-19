import os
import time
import csv
import json
import pandas as pd
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, ".env")
load_dotenv(dotenv_path=env_path)

input_csv = os.path.expanduser("~/Desktop/nyay-khoj/dataset/injudgements_full_from_db.csv")
sample_ids_path = os.path.expanduser("~/Desktop/nyay-khoj/dataset/labeling_sample_ids.csv")
output_csv = os.path.expanduser("~/Desktop/nyay-khoj/dataset/llm_labeled_verdicts.csv")

valid_categories = {"Dismissed", "Appeal Allowed", "Convicted", "Acquitted"}

def clean_label(raw_label):
    # Strip whitespace, quotes, markdown formatting, and trailing periods
    cleaned = raw_label.strip().replace("*", "").replace('"', "").replace("'", "").rstrip(".")
    # Exact case-insensitive matching
    for cat in valid_categories:
        if cleaned.lower() == cat.lower():
            return cat
    # Substring matching
    for cat in valid_categories:
        if cat.lower() in cleaned.lower():
            return cat
    return cleaned

def classify_verdict_with_retry(client, text, max_retries=3):
    prompt = f"""You are a legal classifier. Your task is to analyze the following court judgment text and classify the final verdict into exactly one of these four categories:
1. Dismissed
2. Appeal Allowed
3. Convicted
4. Acquitted

Judgment Text (truncated):
{text[:3000]}

Respond with ONLY the single label word from the four categories list (i.e., exactly one of "Dismissed", "Appeal Allowed", "Convicted", "Acquitted"). Do not include any explanation, preamble, markdown formatting, or punctuation.
"""
    retries = 0
    backoff = 2.0
    
    while retries <= max_retries:
        try:
            response = client.chat.completions.create(
                messages=[
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.1-8b-instant",
                temperature=0.0,
                max_tokens=10
            )
            raw_label = response.choices[0].message.content.strip()
            label = clean_label(raw_label)
            return label
        except Exception as e:
            retries += 1
            if retries > max_retries:
                print(f"Failed to query Groq after {max_retries} retries. Error: {e}", flush=True)
                raise e
            sleep_time = backoff * (2 ** (retries - 1))
            print(f"API call failed: {e}. Retrying in {sleep_time:.2f} seconds...", flush=True)
            time.sleep(sleep_time)

def main():
    start_time = time.time()
    
    # 1. Load data
    print(f"Loading dataset from {input_csv}...", flush=True)
    df = pd.read_csv(input_csv)
    print(f"Loaded {len(df)} rows from dataset.", flush=True)
    
    # 2. Sample 8000 rows or load existing sample IDs
    if os.path.exists(sample_ids_path):
        print(f"Loading existing sample IDs from {sample_ids_path}...", flush=True)
        sample_df = pd.read_csv(sample_ids_path)
        sampled_ids = sample_df["id"].tolist()
        sampled_df = df[df["id"].isin(sampled_ids)].copy()
    else:
        print("Sampling 8000 rows with random_state=42...", flush=True)
        sampled_df = df.sample(n=8000, random_state=42).copy()
        sampled_df[["id"]].to_csv(sample_ids_path, index=False)
        print(f"Saved sampled IDs to {sample_ids_path}", flush=True)
        
    print(f"Total rows in sample to label: {len(sampled_df)}", flush=True)
    
    # 3. Resume logic: Skip already present IDs
    labeled_ids = set()
    if os.path.exists(output_csv):
        try:
            out_df = pd.read_csv(output_csv)
            labeled_ids = set(out_df["id"].tolist())
            print(f"Found {len(labeled_ids)} already labeled rows. Skipping them.", flush=True)
        except Exception as e:
            print(f"Warning: could not read existing output file: {e}. Starting fresh.", flush=True)
            
    remaining_df = sampled_df[~sampled_df["id"].isin(labeled_ids)].copy()
    print(f"Remaining rows to process: {len(remaining_df)}", flush=True)
    
    if len(remaining_df) == 0:
        print("All rows in the sample have already been labeled.", flush=True)
    else:
        # Initialize Groq client
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY is not set in environment or env file!")
        client = Groq(api_key=api_key)
        
        # Write header to output CSV if starting fresh
        if not os.path.exists(output_csv):
            with open(output_csv, "w", newline="") as f:
                writer = csv.writer(f)
                writer.writerow(["id", "verdict_label"])
                
        # 4. Processing Loop
        count = 0
        for idx, row in remaining_df.iterrows():
            row_id = row["id"]
            text = str(row["Text"])
            
            try:
                label = classify_verdict_with_retry(client, text)
                
                # Append incrementally
                with open(output_csv, "a", newline="") as f:
                    writer = csv.writer(f)
                    writer.writerow([row_id, label])
                    
                count += 1
                if count % 100 == 0:
                    print(f"Progress: Labeled {count}/{len(remaining_df)} rows in this run.", flush=True)
                    
                # Respect rate limits
                time.sleep(2.1)
                
            except Exception as e:
                print(f"Skipping row {row_id} due to persistent error: {e}", flush=True)
                
    end_time = time.time()
    elapsed_time = end_time - start_time
    
    # 5. Output summary and final label distribution
    if os.path.exists(output_csv):
        final_df = pd.read_csv(output_csv)
        print("\n=== Final Class Distribution ===", flush=True)
        print(final_df["verdict_label"].value_counts(), flush=True)
        print(f"Total labeled rows: {len(final_df)}", flush=True)
        
    print(f"Total time taken: {elapsed_time:.2f} seconds", flush=True)

if __name__ == "__main__":
    main()
