import { useState } from "react";

export default function Home() {
    const [file, setFile] = useState(null);
    const [transcript, setTranscript] = useState("");
    const [clarityScore, setClarityScore] = useState(null);
    const [tone, setTone] = useState("");
    const [persuasionScore, setPersuasionScore] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fillerScore, setFillerScore] = useState(null);
    const [wordsPerMinute, setWordsPerMinute] = useState(null);
    const [expectedTone, setExpectedTone] = useState("");
    const [toneFeedback, setToneFeedback] = useState("");
    const [benchmarkScore, setBenchmarkScore] = useState({});
    const [improvementSuggestions, setImprovementSuggestions] = useState([]);
    const [benchmarkIdeal, setBenchmarkIdeal] = useState({});




    const getColor = (score, type) => {
        if (type === "tone") {
            return score === "Positive" ? "text-green-500" : score === "Negative" ? "text-red-500" : "text-gray-500";
        } else {
            return score > 0.7 ? "text-green-500" : score > 0.3 ? "text-yellow-500" : "text-red-500";
        }
    };

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
            setClarityScore(data.clarity_score);
            setTone(data.tone);
            setPersuasionScore(data.persuasion_score);
            setFillerScore(data.filler_score);
            setWordsPerMinute(data.words_per_minute);
            setExpectedTone(data.expected_tone);
            setToneFeedback(data.tone_feedback);
            setBenchmarkScore(data.benchmark_score);
            setBenchmarkIdeal(data.benchmark_ideal); // Store ideal benchmarks
            setImprovementSuggestions(data.improvement_suggestions);


        } catch (error) {
            console.error("Error:", error);
            alert("Error uploading file. Please try again.");
        }
    
        setLoading(false);
    };
    
    

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl p-8 transition-all duration-300">
                <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Sales Pitch Analyzer
                </h1>

                <div className="space-y-6">
                    {/* File Upload Section */}
                    <div className="flex flex-col items-center border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-indigo-500 transition-colors">
                        <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => setFile(e.target.files[0])}
                            id="file-upload"
                            className="hidden"
                        />
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer flex flex-col items-center"
                        >
                            <svg
                                className="w-12 h-12 text-indigo-500 mb-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                                />
                            </svg>
                            <span className="text-lg font-medium text-gray-600">
                                {file ? file.name : "Choose audio file"}
                            </span>
                            <span className="text-sm text-gray-500 mt-2">
                                MP3, WAV, or AAC (MAX. 5MB)
                            </span>
                        </label>
                    </div>

                    {/* Analyze Button */}
                    <button
                        onClick={handleUpload}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Analyzing...
                            </>
                        ) : (
                            "Analyze Speech"
                        )}
                    </button>

                    {transcript && (
                        <div className="mt-8 space-y-6">
                            {/* Transcript Section */}
                            <div className="bg-gray-50 rounded-xl p-6">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Transcript</h2>
                                <p className="text-gray-600 leading-relaxed">{transcript}</p>
                            </div>

                            {/* Metrics Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {/* Filler Words */}
                                <div className="bg-red-50 p-5 rounded-xl">
                                    <h3 className="text-sm font-semibold text-red-600 mb-2">Filler Words</h3>
                                    <div className={`text-3xl font-bold ${getColor(fillerScore)}`}>
                                        {fillerScore}
                                        <span className="text-sm ml-1">/1.0</span>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-600">
                                        Ideal: {benchmarkIdeal.filler_words}%
                                    </div>
                                </div>

                                {/* Speaking Speed */}
                                <div className="bg-yellow-50 p-5 rounded-xl">
                                    <h3 className="text-sm font-semibold text-yellow-600 mb-2">Speaking Speed</h3>
                                    <div className="text-3xl font-bold">
                                        {wordsPerMinute} <span className="text-sm ml-1">WPM</span>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-600">
                                        Ideal: {benchmarkIdeal.wpm} WPM
                                    </div>
                                </div>

                                {/* Tone Analysis */}
                                <div className="bg-purple-50 p-5 rounded-xl">
                                    <h3 className="text-sm font-semibold text-purple-600 mb-2">Tone Analysis</h3>
                                    <div className={`text-lg font-semibold ${getColor(tone, "tone")}`}>
                                        {tone}
                                    </div>
                                    <div className="mt-2 text-sm text-gray-600">
                                        Expected: {expectedTone}
                                    </div>
                                    <p className="text-xs text-gray-600 italic mt-1">{toneFeedback}</p>
                                </div>

                                {/* Persuasion Score */}
                                <div className="bg-blue-50 p-5 rounded-xl">
                                    <h3 className="text-sm font-semibold text-blue-600 mb-2">Persuasion</h3>
                                    <div className={`text-3xl font-bold ${getColor(persuasionScore)}`}>
                                        {persuasionScore}
                                        <span className="text-sm ml-1">/1.0</span>
                                    </div>
                                    <div className="mt-2 text-sm text-gray-600">
                                        Ideal: {benchmarkIdeal.persuasion}%
                                    </div>
                                </div>
                            </div>

                            {/* Benchmark Comparison */}
                            <div className="mt-8 bg-gray-50 p-6 rounded-xl">
                                <h2 className="text-xl font-semibold text-gray-800 mb-4">Performance vs Elite Benchmark</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(benchmarkScore).map(([metric, value]) => (
                                        <div key={metric} className="bg-white p-4 rounded-lg shadow-sm">
                                            <div className="flex justify-between items-center">
                                                <span className="capitalize font-medium text-gray-700">
                                                    {metric.replace('_', ' ')}
                                                </span>
                                                <span className={`text-lg font-semibold ${getColor(value / 100)}`}>
                                                    {value}%
                                                </span>
                                            </div>
                                            <div className="mt-2 h-2 bg-gray-200 rounded-full">
                                                <div
                                                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                                                    style={{ width: `${value}%` }}
                                                ></div>
                                            </div>
                                            <div className="mt-2 text-sm text-gray-500">
                                                Elite Benchmark: {benchmarkIdeal[metric]}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Improvement Suggestions */}
                            <div className="mt-4 bg-green-50 p-6 rounded-xl">
                                <h2 className="text-lg font-semibold text-green-700 mb-4">Improvement Suggestions</h2>
                                <div className="space-y-3">
                                    {improvementSuggestions.length > 0 ? (
                                        improvementSuggestions.map((suggestion, index) => (
                                            <div key={index} className="flex items-start">
                                                <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center mr-3">
                                                    {index + 1}
                                                </span>
                                                <p className="text-gray-700">{suggestion}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-green-700 font-medium">
                                            🎉 No major improvements needed. Great job!
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}