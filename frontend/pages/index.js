import { useState } from "react";

export default function Home() {
    const [file, setFile] = useState(null);
    const [transcript, setTranscript] = useState("");
    const [loading, setLoading] = useState(false);

    // Function to upload the audio file and get transcription
    const handleUpload = async () => {
        if (!file) return alert("Please select a file");

        setLoading(true);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("http://127.0.0.1:8000/transcribe", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Failed to fetch transcription");
            }

            const data = await response.json();
            setTranscript(data.transcript);
        } catch (error) {
            console.error("Error:", error);
            alert("Error uploading file. Please try again.");
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-10">
            <h1 className="text-3xl font-bold mb-6">AI Sales Pitch Coach</h1>

            <input
                type="file"
                accept="audio/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="mb-4"
            />

            <button
                onClick={handleUpload}
                className="bg-blue-500 text-white px-4 py-2 rounded"
                disabled={loading}
            >
                {loading ? "Processing..." : "Upload & Transcribe"}
            </button>

            {transcript && (
                <div className="mt-6 p-4 bg-white shadow-lg w-full max-w-2xl">
                    <h2 className="text-lg font-semibold">Transcription:</h2>
                    <p className="mt-2">{transcript}</p>
                </div>
            )}
        </div>
    );
}
