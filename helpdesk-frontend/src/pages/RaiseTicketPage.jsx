// src/pages/RaiseTicketPage.jsx
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createTicket } from "../services/api";
import { useNavigate, Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

const RaiseTicketPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!title.trim()) {
      setError("Please enter a title for your ticket");
      return;
    }
    
    if (!description.trim()) {
      setError("Please describe your issue");
      return;
    }

    if (!user || !user.id) {
      setError("You must be logged in to create a ticket");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Prepare ticket data in format your backend expects
      const ticketData = {
        title: title.trim(),
        description: description.trim(),
        category,
        createdBy: user.id, // Your backend expects this field
      };

      console.log("Creating ticket with data:", ticketData);
      
      const response = await createTicket(ticketData);
      console.log("Ticket created successfully:", response);

      // Show success and navigate
      alert("Ticket created successfully!");
      navigate("/my-tickets");
      
    } catch (err) {
      console.error("Failed to create ticket:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to create ticket";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center bg-white p-8 rounded-xl shadow">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please login to raise a support ticket</p>
          <Link 
            to="/login" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition inline-block"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Back Button */}
        <Link
          to="/dashboard"
          className="flex items-center text-blue-600 hover:text-blue-500 mb-6"
        >
          <FaArrowLeft className="mr-2" />
          Back to Dashboard
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-8 text-gray-800">Raise a New Ticket</h1>

          {/* Error display */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title field */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Title *
              </label>
              <input
                type="text"
                placeholder="Brief description of your issue"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                required
                disabled={loading}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {title.length}/200 characters
              </p>
            </div>

            {/* Category field */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                disabled={loading}
              >
                <option value="billing">💳 Billing & Payments</option>
                <option value="tech">🔧 Technical Support</option>
                <option value="shipping">📦 Shipping & Delivery</option>
                <option value="other">❓ Other</option>
              </select>
            </div>

            {/* Description field */}
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">
                Description *
              </label>
              <textarea
                placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, or relevant information..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-vertical"
                rows={6}
                required
                disabled={loading}
                maxLength={2000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {description.length}/2000 characters
              </p>
            </div>

            {/* Submit button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="flex-1 py-4 px-6 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !title.trim() || !description.trim()}
                className={`flex-1 py-4 px-6 rounded-lg font-semibold transition ${
                  loading || !title.trim() || !description.trim()
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {loading ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                    Creating...
                  </>
                ) : (
                  "Create Ticket"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RaiseTicketPage;



