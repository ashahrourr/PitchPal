from fastapi import FastAPI, UploadFile, File
import whisper

app = FastAPI()
model = whisper.load_model("base")  # Load Whisper AI model

@app.get("/")
async def root():
    return {"message": "Sales Pitch Coach API is running!"}

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    audio = await file.read()
    
    # Save the audio file temporarily
    with open("temp_audio.mp3", "wb") as f:
        f.write(audio)

    # Transcribe using Whisper
    result = model.transcribe("temp_audio.mp3")

    return {"transcript": result["text"]}
