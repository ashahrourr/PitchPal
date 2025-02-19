# backend/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import whisper
import librosa
import numpy as np
from textblob import TextBlob
from transformers import pipeline
from sentence_transformers import SentenceTransformer
from keybert import KeyBERT
import spacy
import tempfile
import os
from sklearn.metrics.pairwise import cosine_similarity
import traceback

# Initialize FastAPI
app = FastAPI(title="Sales Coach Pro API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load AI Models
model = whisper.load_model("base")
sbert_model = SentenceTransformer('all-mpnet-base-v2')
kw_model = KeyBERT()
nlp = spacy.load("en_core_web_lg")
sentiment_analyzer = pipeline(
    "sentiment-analysis", 
    model="distilbert-base-uncased-finetuned-sst-2-english", 
    revision="714eb0f"
)

# Sales Framework Keywords
SALES_FRAMEWORKS = {
    "AIDA": ["attention", "interest", "desire", "action"],
    "SPIN": ["situation", "problem", "implication", "need-payoff"],
    "BANT": ["budget", "authority", "need", "timeline"]
}

# Enhanced Challenges Data
challenges = [
    {
        "id": 1,
        "title": "Cold Call Conversion",
        "category": "Cold Outreach",
        "difficulty": "Medium",
        "description": "Convert a hesitant lead who downloaded content but never responded",
        "scenario": {
            "customer_profile": "CTO at mid-sized SaaS company",
            "product": "Cloud security platform",
            "key_objections": ["No budget", "Happy with current solution", "No immediate need"],
            "success_metrics": {
                "persuasion": 85,
                "relevance": 90,
                "objection_handling": 80,
                "framework_adherence": 75
            }
        },
        "sample_solution": {
            "framework": "AIDA",
            "required_elements": [
                "ROI mention in first 30s",
                "Address 3 common objections",
                "Request concrete next steps"
            ],
            "example_phrases": [
                "Many clients saw 40% cost reduction after switching...",
                "Would next Tuesday work for a 15-minute demo?"
            ]
        }
    },
    # Add more challenges as needed
]

def analyze_objections(transcript: str, target_objections: List[str]) -> Dict:
    """Analyze how well objections are handled using semantic similarity"""
    objection_embeddings = sbert_model.encode(target_objections)
    sentence_embeddings = sbert_model.encode([sent.text for sent in nlp(transcript).sents])
    
    handled = []
    for idx, obj_emb in enumerate(objection_embeddings):
        similarities = cosine_similarity([obj_emb], sentence_embeddings)
        if np.max(similarities) > 0.65:
            handled.append(target_objections[idx])
    
    return {
        "handled": handled,
        "missed": [obj for obj in target_objections if obj not in handled]
    }

def check_sales_framework(transcript: str, framework: str) -> float:
    """Evaluate adherence to sales methodologies using keyword extraction"""
    doc = nlp(transcript.lower())
    framework_keywords = SALES_FRAMEWORKS.get(framework, [])
    
    found_keywords = []
    for token in doc:
        if token.lemma_ in framework_keywords:
            found_keywords.append(token.lemma_)
    
    return len(set(found_keywords)) / len(framework_keywords) if framework_keywords else 0

def generate_feedback(analysis: Dict, challenge: Dict) -> List[str]:
    """Generate actionable feedback based on analysis results"""
    feedback = []
    
    # Framework feedback
    framework_score = analysis["framework_score"]
    if framework_score < 0.7:
        required = challenge["sample_solution"]["required_elements"]
        feedback.append(f"⚠️ Missing key elements: {', '.join(required[:2])}...")
    
    # Objection handling feedback
    if analysis["objections_handled"]["missed"]:
        feedback.append(f"❌ Unaddressed objections: {', '.join(analysis['objections_handled']['missed'])}")
    
    return feedback

@app.get("/challenges")
async def get_challenges():
    """Return enhanced challenges list"""
    return {"challenges": challenges}

@app.post("/evaluate/{challenge_id}")
async def evaluate_speech(challenge_id: int, file: UploadFile = File(...)):
    """Enhanced evaluation endpoint"""
    try:
        # Validate challenge
        challenge = next((c for c in challenges if c["id"] == challenge_id), None)
        if not challenge:
            raise HTTPException(status_code=404, detail="Challenge not found")

        # Save temporary audio file
        with tempfile.NamedTemporaryFile(delete=False) as temp_audio:
            temp_audio.write(await file.read())
            audio_path = temp_audio.name

        # Process audio
        audio_duration = librosa.get_duration(filename=audio_path)
        result = model.transcribe(audio_path)
        transcript = result["text"]
        os.unlink(audio_path)  # Clean up

        # Core analysis
        analysis = {
            "transcript": transcript,
            "duration": audio_duration,
            "words_per_minute": len(transcript.split()) / (audio_duration / 60)
        }

        # Content analysis
        analysis["objections_handled"] = analyze_objections(
            transcript, 
            challenge["scenario"]["key_objections"]
        )
        
        # Framework adherence
        analysis["framework_score"] = check_sales_framework(
            transcript,
            challenge["sample_solution"]["framework"]
        )

        # Semantic relevance
        ideal_phrases = challenge["sample_solution"]["example_phrases"]
        ideal_embedding = sbert_model.encode(ideal_phrases)
        user_embedding = sbert_model.encode([transcript])
        analysis["content_relevance"] = float(cosine_similarity(
            [np.mean(ideal_embedding, axis=0)], 
            [np.mean(user_embedding, axis=0)]
        )[0][0])

        # Sentiment analysis
        sentiment = sentiment_analyzer(transcript)[0]
        analysis["sentiment"] = {
            "label": sentiment["label"],
            "score": sentiment["score"]
        }

        # Generate feedback
        analysis["feedback"] = generate_feedback(analysis, challenge)

        # Calculate overall score
        success_metrics = challenge["scenario"]["success_metrics"]
        analysis["scores"] = {
            "persuasion": round(sentiment["score"] * 100, 1),
            "relevance": round(analysis["content_relevance"] * 100, 1),
            "objection_handling": round(
                len(analysis["objections_handled"]["handled"]) / 
                len(challenge["scenario"]["key_objections"]) * 100, 1
            ),
            "framework_adherence": round(analysis["framework_score"] * 100, 1)
        }

        # Pass/fail determination
        passed = all(
            analysis["scores"][k] >= v 
            for k, v in success_metrics.items()
        )
        analysis["passed"] = passed

        return analysis

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(
            status_code=500, 
            detail=f"Error processing request: {str(e)}"
        ) from e

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)