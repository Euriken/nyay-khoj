import os
import time
import shutil
import json
import pandas as pd
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from huggingface_hub import hf_hub_download

def main():
    # 1. Define paths
    input_csv = os.path.expanduser("~/Desktop/nyay-khoj/dataset/injudgements_full_from_db.csv")
    output_csv = os.path.expanduser("~/legal-backend/verdict_predictions.csv")
    backup_csv = os.path.expanduser("~/legal-backend/verdict_predictions_old.csv")
    repo_id = "Euriken/nyay-khoj-verdict-classifier"
    batch_size = 32
    max_length = 512

    # 2. Back up the existing verdict_predictions.csv before overwriting
    if os.path.exists(output_csv):
        shutil.copy(output_csv, backup_csv)
        print(f"Successfully backed up existing predictions to {backup_csv}")
    else:
        print("No existing predictions file to back up.")

    # 3. Load model and tokenizer from HuggingFace Hub
    print(f"Loading tokenizer and model from HF Hub repo: '{repo_id}'...")
    tokenizer = AutoTokenizer.from_pretrained(repo_id)
    model = AutoModelForSequenceClassification.from_pretrained(repo_id, torch_dtype=torch.float32)
    model.eval()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = model.to(device)
    print(f"Model successfully loaded and moved to {device}")

    # 4. Load label mapping from repo's label_classes.json
    print("Loading label mapping classes...")
    label_classes_path = hf_hub_download(repo_id=repo_id, filename="label_classes.json")
    with open(label_classes_path, "r") as f:
        label_classes = json.load(f)
    print(f"Loaded label classes: {label_classes}")

    # 5. Read input judgements dataset
    print(f"Reading input dataset from {input_csv}...")
    df = pd.read_csv(input_csv, usecols=["id", "Text"])
    # Clean and pre-truncate texts to 4000 characters to optimize tokenizer speed
    texts = df["Text"].fillna("").astype(str).str[:4000].tolist()
    ids = df["id"].tolist()
    total_rows = len(texts)
    print(f"Loaded {total_rows} rows from dataset.")

    # 6. Run batch inference
    print("Starting batch inference...")
    start_time = time.time()
    predictions = []

    for i in range(0, total_rows, batch_size):
        batch_texts = texts[i:i + batch_size]
        
        # Tokenize inputs
        tokens = tokenizer(
            batch_texts,
            truncation=True,
            padding=True,
            max_length=max_length,
            return_tensors="pt"
        )
        
        # Move inputs to device
        tokens = {k: v.to(device) for k, v in tokens.items()}
        
        # Inference
        with torch.no_grad():
            outputs = model(**tokens)
            logits = outputs.logits
            batch_preds = logits.argmax(dim=-1).tolist()
            
        # Map indices to label strings and accumulate
        predictions.extend([label_classes[p] for p in batch_preds])
        
        # Print progress every 1000 rows
        processed = min(i + batch_size, total_rows)
        if (processed // 1000) > (i // 1000) or processed == total_rows:
            print(f"Processed {processed}/{total_rows} rows...")

    end_time = time.time()
    time_taken = end_time - start_time

    # 7. Write output to csv
    print(f"Writing output to {output_csv}...")
    out_df = pd.DataFrame({
        "id": ids,
        "predicted_verdict": predictions
    })
    out_df.to_csv(output_csv, index=False)

    print(f"Completed! Total row count: {total_rows}")
    print(f"Time taken: {time_taken:.2f} seconds")

if __name__ == "__main__":
    main()
