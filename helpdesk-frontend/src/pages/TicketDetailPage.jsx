// src/pages/TicketDetailPage.jsx - Debug Version
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  FaArrowLeft, 
  FaClock, 
  FaTag, 
  FaUser, 
  FaRobot, 
  FaThumbsUp, 
  FaThumbsDown,
  FaHistory
} from 'react-icons/fa';

const TicketDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    fetchTicketData();
  }, [id]);

  const fetchTicketData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching ticket with ID:', id);
      console.log('User:', user);
      
      // Fetch ticket details - using api directly
      try {
        const response = await api.get(`/tickets/${id}`);
        console.log('Ticket API Response:', response);
        
        // Handle different response structures
        const ticketData = response.data?.ticket || response.data;
        console.log('Extracted ticket data:', ticketData);
        
        if (ticketData && ticketData._id) {
          setTicket(ticketData);
        } else {
          throw new Error('Invalid ticket data received');
        }
      } catch (ticketError) {
        console.error('Error fetching ticket:', ticketError);
        console.error('Error response:', ticketError.response);
        
        // If it's a 500 error due to populate issue, try without populate
        if (ticketError.response?.status === 500) {
          console.log('Retrying without populate...');
          // The backend should handle this, but let's see the error
        }
        
        setError(ticketError.response?.data?.message || ticketError.message || 'Failed to fetch ticket');
        throw ticketError;
      }
      
      // Try to fetch AI suggestions (optional - don't fail if not available)
      try {
        const suggestionResponse = await api.get(`/tickets/${id}/suggestion`);
        console.log('Suggestion response:', suggestionResponse);
        
        if (suggestionResponse.data?.suggestion) {
          setSuggestion(suggestionResponse.data.suggestion);
          setFeedbackSubmitted(!!suggestionResponse.data.suggestion.feedback?.helpful);
        }
      } catch (err) {
        console.log('No AI suggestion available (this is okay)');
      }
      
      // Try to fetch audit logs (optional)
      try {
        const auditResponse = await api.get(`/tickets/${id}/audit`);
        console.log('Audit response:', auditResponse);
        
        if (auditResponse.data?.auditLogs) {
          setAuditLogs(auditResponse.data.auditLogs);
        }
      } catch (err) {
        console.log('No audit logs available (this is okay)');
      }
      
    } catch (error) {
      console.error('Fatal error in fetchTicketData:', error);
      setError(error.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (helpful) => {
    try {
      const response = await api.post(`/tickets/${id}/suggestion/feedback`, { 
        helpful, 
        feedback: helpful ? 'Helpful' : 'Not helpful' 
      });
      console.log('Feedback response:', response);
      setFeedbackSubmitted(true);
      await fetchTicketData(); // Refresh data
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'triaged': return 'bg-purple-100 text-purple-800';
      case 'waiting_human': return 'bg-orange-100 text-orange-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status) => {
    return status.replace(/_/g, ' ').toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading ticket {id}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Ticket</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600 mb-4">Ticket ID: {id}</p>
          <div className="space-y-2">
            <button
              onClick={() => fetchTicketData()}
              className="block w-full text-center bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Try Again
            </button>
            <Link
              to="/my-tickets"
              className="block text-center text-blue-600 hover:text-blue-500"
            >
              Return to tickets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ticket not found</h2>
          <p className="text-gray-600 mb-4">Unable to load ticket with ID: {id}</p>
          <Link
            to="/my-tickets"
            className="text-blue-600 hover:text-blue-500"
          >
            Return to tickets
          </Link>
        </div>
      </div>
    );
  }

  // Main render with ticket data
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Debug info - remove in production */}
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mb-4 text-xs">
          Debug: Ticket ID: {ticket._id}, Status: {ticket.status}, Created By: {ticket.createdBy?.email || ticket.createdBy}
        </div>

        {/* Back Button */}
        <Link
          to="/my-tickets"
          className="flex items-center text-blue-600 hover:text-blue-500 mb-6"
        >
          <FaArrowLeft className="mr-2" />
          Back to Tickets
        </Link>
        
        {/* Main Ticket Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
            <div className="flex gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(ticket.status)}`}>
                {formatStatus(ticket.status)}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                #{ticket._id.slice(-6)}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-6">
            <div className="flex items-center">
              <FaUser className="mr-2 text-gray-400" />
              Created by {ticket.createdBy?.name || ticket.createdBy?.email || 'Unknown'}
            </div>
            <div className="flex items-center">
              <FaTag className="mr-2 text-gray-400" />
              Category: {ticket.category}
            </div>
            <div className="flex items-center">
              <FaClock className="mr-2 text-gray-400" />
              {new Date(ticket.createdAt).toLocaleDateString()}
            </div>
          </div>
          
          <div className="border-t pt-4">
            <h3 className="font-medium text-gray-900 mb-2">Description:</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Agent Reply */}
          {ticket.agentReply && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium text-gray-900 mb-2">Support Response:</h3>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{ticket.agentReply}</p>
                {ticket.repliedAt && (
                  <p className="text-sm text-gray-500 mt-2">
                    Replied on {new Date(ticket.repliedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* AI Suggestion Section */}
        {suggestion && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center mb-4">
              <FaRobot className="text-blue-600 mr-3 text-xl" />
              <h2 className="text-xl font-semibold text-gray-900">AI Assistant Response</h2>
              <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Confidence: {Math.round(suggestion.confidence * 100)}%
              </span>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{suggestion.draftReply}</p>
            </div>

            {/* Feedback Section */}
            {!feedbackSubmitted && ticket.status !== 'closed' ? (
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Was this response helpful?</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleFeedback(true)}
                    className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200"
                  >
                    <FaThumbsUp className="mr-2" />
                    Yes, helpful
                  </button>
                  <button
                    onClick={() => handleFeedback(false)}
                    className="flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200"
                  >
                    <FaThumbsDown className="mr-2" />
                    Not helpful
                  </button>
                </div>
              </div>
            ) : feedbackSubmitted && (
              <div className="border-t pt-4">
                <p className="text-green-600 font-medium">✓ Thank you for your feedback!</p>
              </div>
            )}
          </div>
        )}

        {/* Audit Timeline */}
        {auditLogs && auditLogs.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center mb-4">
              <FaHistory className="text-gray-600 mr-3 text-xl" />
              <h2 className="text-xl font-semibold text-gray-900">Activity Timeline</h2>
            </div>
            <div className="space-y-3">
              {auditLogs.map((log, index) => (
                <div key={log._id || index} className="flex items-start space-x-3 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">
                        {log.action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="text-gray-500 text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetailPage;




