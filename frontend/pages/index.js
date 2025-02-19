import { useState, useEffect } from "react";

export default function Home() {
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState({
    scores: {
      persuasion: null,
      relevance: null,
      objection_handling: null,
      framework_adherence: null
    },
    feedback: [],
    keyPhrases: [],
    transcript: "",
    passed: null
  });

  // Fetch challenges from backend
  useEffect(() => {
    fetch("http://localhost:8000/challenges")
      .then((res) => res.json())
      .then((data) => setChallenges(data.challenges))
      .catch((error) => console.error("Error fetching challenges:", error));
  }, []);

  const selectChallenge = (challenge) => {
    setSelectedChallenge(challenge);
    setEvaluation({
      scores: {
        persuasion: null,
        relevance: null,
        objection_handling: null,
        framework_adherence: null
      },
      feedback: [],
      keyPhrases: [],
      transcript: "",
      passed: null
    });
    setFile(null);
  };

  const handleUpload = async () => {
    if (!file || !selectedChallenge) {
      alert("Please select a challenge and upload a file.");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        `http://localhost:8000/evaluate/${selectedChallenge.id}`,
        { method: "POST", body: formData }
      );

      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();

      setEvaluation({
        scores: data.scores,
        feedback: data.feedback,
        keyPhrases: data.key_phrases || [],
        transcript: data.transcript,
        passed: data.passed
      });

    } catch (error) {
      console.error("Error:", error);
      alert("Error processing your speech. Please try again.");
    }
    setLoading(false);
  };

  const ScoreCard = ({ label, value }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
          Target: {selectedChallenge?.scenario.success_metrics[label.toLowerCase()] || 0}%
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold text-gray-900">
          {value}%
        </div>
        <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
            style={{ width: `${value}%` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">SC</span>
          </div>
          <span className="text-xl font-bold">SalesCoach</span>
        </div>
        <nav className="flex items-center gap-6 text-sm">
          <button className="text-gray-600 hover:text-orange-600 transition-colors">
            Challenges
          </button>
          <button className="text-gray-600 hover:text-orange-600 transition-colors">
            Progress
          </button>
          <button className="text-gray-600 hover:text-orange-600 transition-colors">
            Profile
          </button>
        </nav>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Challenges Sidebar */}
        <aside className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Training Challenges</h2>
            <p className="text-sm text-gray-500 mt-1">Master sales scenarios</p>
          </div>
          <div className="p-2">
            {challenges.map((challenge) => (
              <button
                key={challenge.id}
                onClick={() => selectChallenge(challenge)}
                className={`w-full text-left p-3 rounded-lg mb-2 transition-all ${
                  selectedChallenge?.id === challenge.id
                    ? 'bg-orange-50 border-2 border-orange-500'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {challenge.title}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    challenge.difficulty === 'Easy' 
                      ? 'bg-green-100 text-green-800'
                      : challenge.difficulty === 'Medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {challenge.difficulty}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {challenge.description}
                </p>
                <div className="mt-2 flex gap-2">
                  {challenge.scenario.key_objections.slice(0, 2).map((obj, i) => (
                    <span key={i} className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                      {obj}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          {!selectedChallenge ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              Select a challenge from the sidebar to begin
            </div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Challenge Header */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {selectedChallenge.title}
                </h1>
                <div className="flex items-center gap-4 text-sm">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {selectedChallenge.category}
                  </span>
                  <div className="flex items-center gap-2 text-gray-500">
                    <span>Expected Tone:</span>
                    <span className="font-medium text-gray-700">
                      {selectedChallenge.scenario.expected_tone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scenario Details */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold mb-4">Scenario Details</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Customer Profile</h3>
                    <p className="text-gray-700">
                      {selectedChallenge.scenario.customer_profile}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Key Objections</h3>
                    <ul className="list-disc pl-4 space-y-1">
                      {selectedChallenge.scenario.key_objections.map((obj, i) => (
                        <li key={i} className="text-gray-700">{obj}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Upload Section */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold mb-6">Record Your Pitch</h2>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center transition-colors hover:border-orange-200">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center space-y-4"
                  >
                    <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">
                        {file ? file.name : 'Click to upload audio file'}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Supported formats: MP3, WAV, AAC (max 5MB)
                      </p>
                    </div>
                  </label>
                </div>
                <button
                  onClick={handleUpload}
                  disabled={loading}
                  className="mt-6 w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-6 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Analyzing...
                    </span>
                  ) : (
                    'Submit for Evaluation'
                  )}
                </button>
              </div>

              {/* Results Section */}
              {evaluation.passed !== null && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-8">
                  {/* Result Header */}
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Evaluation Results</h2>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      evaluation.passed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {evaluation.passed ? 'Challenge Passed' : 'Needs Improvement'}
                    </span>
                  </div>

                  {/* Score Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ScoreCard label="Persuasion" value={evaluation.scores.persuasion} />
                    <ScoreCard label="Relevance" value={evaluation.scores.relevance} />
                    <ScoreCard
                      label="Objection Handling"
                      value={evaluation.scores.objection_handling}
                    />
                    <ScoreCard
                      label="Framework Adherence"
                      value={evaluation.scores.framework_adherence}
                    />
                  </div>

                  {/* Key Phrases */}
                  {evaluation.keyPhrases.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Key Phrases Detected</h3>
                      <div className="flex flex-wrap gap-2">
                        {evaluation.keyPhrases.map((phrase, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                          >
                            {phrase}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  {evaluation.feedback.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Improvement Suggestions</h3>
                      <div className="space-y-3">
                        {evaluation.feedback.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-start p-4 bg-red-50 rounded-lg border border-red-100"
                          >
                            <svg
                              className="flex-shrink-0 w-5 h-5 text-red-600 mt-0.5 mr-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                            <p className="text-red-700">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Transcript */}
                  {evaluation.transcript && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Full Transcript</h3>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                          {evaluation.transcript}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}