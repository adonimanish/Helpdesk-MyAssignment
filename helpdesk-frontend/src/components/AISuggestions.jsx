// src/components/AISuggestions.jsx
import { useState } from "react";
import { FaRobot, FaThumbsUp, FaThumbsDown, FaLightbulb } from "react-icons/fa";

const AISuggestions = ({ suggestions, ticketId, onFeedback }) => {
  const [feedbackGiven, setFeedbackGiven] = useState({});

  const handleFeedback = (suggestionId, isHelpful) => {
    if (feedbackGiven[suggestionId]) return;
    
    setFeedbackGiven(prev => ({ ...prev, [suggestionId]: true }));
    if (onFeedback) {
      onFeedback(suggestionId, isHelpful);
    }
  };

  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  // Handle both array of suggestions and single suggestion object
  const suggestionsList = Array.isArray(suggestions) ? suggestions : [suggestions];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center mb-4">
        <FaRobot className="text-blue-600 text-xl mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">AI Assistant Suggestions</h3>
      </div>

      <div className="space-y-4">
        {suggestionsList.map((suggestion, index) => (
          <div key={suggestion._id || index} className="border-l-4 border-blue-200 pl-4">
            {/* Suggestion Header */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <FaLightbulb className="text-yellow-500" />
                <span className="font-medium text-gray-800">
                  {suggestion.title || `Suggestion ${index + 1}`}
                </span>
              </div>
              {suggestion.confidence && (
                <span className="text-sm text-gray-500">
                  Confidence: {Math.round(suggestion.confidence)}%
                </span>
              )}
            </div>

            {/* Suggestion Content */}
            <div className="bg-gray-50 p-3 rounded-lg mb-3">
              <p className="text-gray-700 text-sm whitespace-pre-wrap">
                {suggestion.content || suggestion.draftReply || "No content available"}
              </p>
            </div>

            {/* Match Reasons */}
            {suggestion.matchReasons && suggestion.matchReasons.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-600 mb-1">Why this was suggested:</p>
                <ul className="text-xs text-gray-500 space-y-1">
                  {suggestion.matchReasons.map((reason, idx) => (
                    <li key={idx}>• {reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Source */}
            {suggestion.source && (
              <p className="text-xs text-gray-500 mb-3">
                Source: {suggestion.source}
              </p>
            )}

            {/* Feedback Buttons */}
            {!feedbackGiven[suggestion._id || index] ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Was this helpful?</span>
                <button
                  onClick={() => handleFeedback(suggestion._id || index, true)}
                  className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm"
                >
                  <FaThumbsUp />
                  <span>Yes</span>
                </button>
                <button
                  onClick={() => handleFeedback(suggestion._id || index, false)}
                  className="flex items-center space-x-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
                >
                  <FaThumbsDown />
                  <span>No</span>
                </button>
              </div>
            ) : (
              <p className="text-sm text-green-600">✓ Thank you for your feedback!</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AISuggestions;