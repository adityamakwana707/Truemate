🧠 PRD 2 — MODEL PRD (Dedicated ML & AI PRD)

This PRD is specifically for model development, architecture, evaluation, and inputs/outputs.

**📌 AI Model Development PRD

TruthMate – Model Specification Document**

Version: 1.0
Audience: Developers, ML Engineers
Scope: Model architecture, input/output schemas, evaluation plans

1. Introduction

This PRD defines all the AI models powering the TruthMate fact-checking system.
It includes model descriptions, I/O format, evaluation methods, and inter-model dependencies.

2. List of Models
CORE MODELS (Lead Dev – Dev A)

Misinformation Classification Model

Stance Detection Model

Cross-Document Fact Matching Model

Summary & Explanation Model

Claim Similarity & Clustering Model

Knowledge Graph Embedding Model

SUPPORTING MODELS (Main Dev – Dev B)

Claim Extraction Model

Fact Extraction & Triple Generation Model

Source Credibility Prediction Model

Sentiment & Emotion Detection Model

Bias Detection Model

OPTIONAL MODELS (Secondary Dev – Dev C)

Image Verification Model

Video Deepfake Model

AI-Generated Text Detector

3. Model Specifications (with Input/Output)
1. Misinformation Classification Model

Goal: Predict if claim is true or false

Input: "claim_text"

Output:

{
  "label": "True | False | Misleading | Unknown",
  "confidence": 0-100
}


Type: LLM + embedding hybrid

2. Stance Detection Model

Goal: Check if article supports/refutes claim

Input: {claim_text, reference_article_text}

Output: "SUPPORTS" | "REFUTES" | "DISCUSSING" | "UNRELATED"

3. Cross-Document Fact Matching Model

Goal: Compare claim with extracted evidence

Input: {claim_embedding, evidence_embeddings[]}

Output: "MATCH" | "PARTIAL MATCH" | "CONFLICT"

4. Summary & Explanation Model

Goal: Generate simple explanation

Input: {claim, evidence_list, verdict}

Output: {summary, eli5_explanation}

5. Claim Similarity & Clustering Model

Goal: Detect repeated claims

Input: {claim_embedding}

Output:

cluster_id
top_similar_claims[]

6. Knowledge Graph Embedding Model

Goal: Represent facts as graph nodes

Input: Triples (subject, predicate, object)

Output: Vector embeddings

Supporting Models
7. Claim Extraction Model

Goal: Extract 1 main claim

Input: Raw text/URL content

Output: Clean claim sentence

8. Triple Extraction Model

Goal: Convert article into facts

Input: Article text

Output: [ (subject, predicate, object) ]

9. Source Credibility Prediction Model

Goal: Score trustworthiness

Input: source_url

Output: {score: 0–100, tag}

10. Sentiment Model

Goal: Detect emotional tone

Input: Article/post

Output: {sentiment, emotion}

11. Bias Model

Goal: Detect political bias

Input: Article text

Output: "left" | "right" | "center" | "sensational"

Optional Models
12. Image Verification Model

Input: Image

Output: "real | fake | ai-generated"

13. Video Deepfake Model

Input: Video

Output: "real | deepfake"

14. AI-Generated Text Detector

Input: Text

Output: "ai-generated | human"

4. Model Evaluation Criteria

Zero-shot LLM accuracy

Evidence retrieval precision

Stance detection agreement with human labels

Embedding similarity threshold tuning

Source scoring consistency

Image detection accuracy (if included)

5. Model Integration Flow

Claim Extraction →

Evidence Search →

Triple Extraction →

Stance Detection →

Fact Matching →

Classification →

Explanation →

UI