TruthMate – AI-Powered Misinformation Detection & Verification System**

Version: 1.0
Document Type: Product-Level PRD
Target: Hackathon-ready web prototype
Platform: Web Application (Mobile + Desktop)

1. Introduction

TruthMate is a web-based AI system designed to verify claims, detect misinformation, and provide users with clear, evidence-backed verdicts.
The system takes in text, URLs, or images, extracts the main claim, searches for evidence, and returns a final verdict with explanation and credibility scoring.

This PRD defines the end-to-end product workflow, features, UI requirements, and high-level AI model descriptions.

2. Problem Statement

The internet is filled with misinformation, rumors, AI-generated content, and biased news.
Users struggle to check:

If something is true or fake

Whether an article supports or opposes a claim

Which sources are trustworthy

Whether an image/video is manipulated

TruthMate solves this by offering one-click verification with AI-powered reasoning and evidence retrieval.

3. Product Objectives

Allow users to verify any claim quickly.

Provide evidence-based verdicts: True, False, Misleading, Unknown.

Detect image manipulation (basic).

Show source credibility, stance, and bias.

Be easy enough for general public, students, journalists.

Maintain transparency with explanations and confidence scores.

4. Target Users

General public

Students & researchers

Journalists & fact-checkers

Social media users

Government digital literacy programs

5. Core Features (MVP)
5.1 Input Verification Panel

Users can input:

Text (claim/headline/post)

URL of an article

Upload an image (optional)

5.2 Claim Extraction

System extracts the main claim sentence from long text/URL.

5.3 Fact Verification Pipeline

The system performs:

Claim classification

Retrieve evidence

Match facts

Analyze stance

5.4 Result Dashboard

Shows:

Final verdict: True / False / Misleading / Unknown

Color code: Green, Red, Yellow

Confidence score

Evidence links

Simple explanation

Source credibility score

5.5 History Page

Stores:

All past checks

Verdict

Timestamp

5.6 Basic Admin Panel

View trending/viral claims

Override or update verdict manually

6. Advanced Features (Optional)

(Shown if time permits)

Image manipulation / deepfake detection

AI-generated text detection

Local language rumor chain detection

URL safety scanning

Auto-generated "Truth Cards"

Source bias visualization

7. System Architecture Overview

Input → Claim Extraction → Evidence Search → Model Ensemble → Verdict → Explanation → UI

8. AI Models (High-Level Descriptions)

(Short, product-friendly descriptions)

Model	One-Line Purpose
Misinformation Classifier	Predicts if claim is True/False/Misleading/Unknown
Stance Detection Model	Checks if article supports or refutes claim
Fact Matching Model	Compares claim with evidence for match/conflict
Claim Similarity Model	Groups similar claims to detect repeated rumors
Claim Extraction Model	Extracts 1 clean claim from long text or URL
Fact Triple Model	Converts article into structured facts
Source Credibility Model	Scores trust level of websites
Sentiment Model	Detects emotional tone (fear, anger, etc.)
Bias Detection Model	Detects political or sensational bias
Image Verification Model	Detects fake / AI-generated / manipulated images
Explanation Model	Generates simple ELI5-style explanations
9. Success Metrics

<2 seconds average verification response (LLM-assisted)

80%+ classification accuracy on test set

User clarity score > 4/5 for explanations

Search recall: at least 5 evidence sources per claim

10. Constraints & Dependencies

Requires LLM API (Claude/OpenAI/GPT)

Needs News API / Bing Search API for evidence

Image deepfake detection limited in MVP