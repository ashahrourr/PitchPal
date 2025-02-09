from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import whisper
import librosa  # For audio duration
from textblob import TextBlob
from transformers import pipeline

app = FastAPI()

# Allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load AI models
model = whisper.load_model("base")
sentiment_analyzer = pipeline("sentiment-analysis")
tone_analyzer = pipeline("text-classification", model="cardiffnlp/twitter-roberta-base-sentiment")

# Define filler words
FILLER_WORDS = ["um", "uh", "like", "you know", "so", "well", "actually", "basically", "right", "okay"]

# Define expected tone mapping based on sales words
EXPECTED_TONE_MAPPING = {
    "excited": ["amazing", "excited", "great", "fantastic", "opportunity", "unbelievable", "incredible"],
    "urgent": ["now", "immediately", "limited time", "act fast", "last chance", "don't miss"],
    "reassuring": ["trust", "reliable", "secure", "safe", "guarantee"],
    "neutral": []  # Default category
}

# Define elite sales speaker benchmarks
ELITE_SPEAKER_AVG = {
    "clarity": 0.9,
    "persuasion": 0.85,
    "filler_words": 0.95,
    "wpm": 140  # Ideal speaking speed
}

@app.get("/")
async def root():
    return {"message": "Sales Pitch Coach API is running!"}

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    audio = await file.read()

    # Save audio file
    with open("temp_audio.mp3", "wb") as f:
        f.write(audio)

    # Get audio duration
    audio_duration = librosa.get_duration(filename="temp_audio.mp3")

    # Transcribe speech
    result = model.transcribe("temp_audio.mp3")
    transcript = result["text"]

    # Clarity Score
    text_blob = TextBlob(transcript)
    clarity_score = round(text_blob.sentiment.polarity, 2)

    # Tone Analysis (AI-detected tone)
    tone_result = tone_analyzer(transcript)
    tone_label = tone_result[0]["label"]
    tone_mapping = {
        "LABEL_0": "Negative",
        "LABEL_1": "Neutral",
        "LABEL_2": "Positive"
    }
    detected_tone = tone_mapping.get(tone_label, "Unknown")

    # Persuasion Score
    sentiment_result = sentiment_analyzer(transcript)
    persuasion_score = round(sentiment_result[0]["score"], 2)

    # Filler Word Detection
    transcript_words = transcript.lower().split()
    filler_count = sum(transcript_words.count(word) for word in FILLER_WORDS)
    filler_score = round(1 - (filler_count / max(len(transcript_words), 1)), 2)

    # Words Per Minute (WPM)
    word_count = len(transcript_words)
    words_per_minute = round((word_count / audio_duration) * 60, 2)

    # Detect expected tone
    matched_tones = [tone for tone, words in EXPECTED_TONE_MAPPING.items() if any(word in transcript.lower() for word in words)]
    expected_tone = matched_tones[0] if matched_tones else "neutral"

    # Provide feedback if tone doesn't match the expected tone
    if detected_tone.lower() != expected_tone:
        tone_feedback = f"Your tone sounds **{detected_tone.lower()}**, but your words suggest you should be **{expected_tone}**."
    else:
        tone_feedback = "Your tone matches your message. Great job!"

    benchmark_score = {
        "clarity": round((clarity_score / ELITE_SPEAKER_AVG["clarity"]) * 100, 2),
        "persuasion": round((persuasion_score / ELITE_SPEAKER_AVG["persuasion"]) * 100, 2),
        "filler_words": round((filler_score / ELITE_SPEAKER_AVG["filler_words"]) * 100, 2),
        "wpm": round(words_per_minute, 2)  # Keep actual WPM instead of percentage
    }

    # Include ideal benchmark values for clear comparison
    benchmark_ideal = {
        "clarity": ELITE_SPEAKER_AVG["clarity"] * 100,  # Convert to percentage
        "persuasion": ELITE_SPEAKER_AVG["persuasion"] * 100,
        "filler_words": ELITE_SPEAKER_AVG["filler_words"] * 100,
        "wpm": ELITE_SPEAKER_AVG["wpm"]  # Keep actual number
    }


    # Generate improvement suggestions with proper rounding
    improvement_suggestions = []
    if benchmark_score["clarity"] < 1:
        improvement_suggestions.append(f"Your clarity is at {round(benchmark_score['clarity'] * 100)}%. Try using simpler sentences and emphasizing key points.")

    if benchmark_score["persuasion"] < 1:
        improvement_suggestions.append(f"Your persuasion is at {round(benchmark_score['persuasion'] * 100)}%. Try adding more confident phrasing and storytelling.")

    if benchmark_score["filler_words"] < 1:
        improvement_suggestions.append(f"You use {100 - round(benchmark_score['filler_words'] * 100)}% more filler words than top salespeople. Reduce 'um', 'uh', and 'like' for a stronger impact.")

    if benchmark_score["wpm"] < 90:
        improvement_suggestions.append(f"Your speaking speed is {round(benchmark_score['wpm'])}% of the ideal pace. Try speaking slightly faster for more engagement.")
    elif benchmark_score["wpm"] > 110:
        improvement_suggestions.append(f"You're speaking {round(benchmark_score['wpm'])}% of the ideal speed. Slow down slightly to ensure better understanding.")


    return {
        "transcript": transcript,
        "clarity_score": clarity_score,
        "tone": detected_tone,
        "persuasion_score": persuasion_score,
        "filler_score": filler_score,
        "words_per_minute": words_per_minute,
        "expected_tone": expected_tone,
        "tone_feedback": tone_feedback,
        "benchmark_score": benchmark_score,
        "benchmark_ideal": benchmark_ideal,  # NEW: Include ideal benchmarks
        "improvement_suggestions": improvement_suggestions
    }

