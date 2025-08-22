// src/components/TicketCard.jsx
import { Link } from "react-router-dom";
import { FaClock, FaTag, FaChevronRight, FaCheckCircle, FaUser, FaRobot } from "react-icons/fa";

const TicketCard = ({ ticket }) => {
  // Defensive check for ticket data
  if (!ticket || !ticket._id) {
    return null;
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'waiting_human':
        return 'bg-orange-100 text-orange-800';
      case 'triaged':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return <FaCheckCircle className="text-green-600" />;
      case 'triaged':
        return <FaRobot className="text-purple-600" />;
      default:
        return <FaClock className="text-gray-500" />;
    }
  };

  // Show AI suggestion indicator if ticket was auto-resolved
  const showAIIndicator = ticket.status === 'resolved' && ticket.agentSuggestionId;

  return (
    <div className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200">
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg text-gray-900 truncate flex-1 mr-4">
            {ticket.title}
          </h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            {getStatusIcon(ticket.status)}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
              {ticket.status.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {ticket.description}
        </p>

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <FaTag className="mr-1" />
              <span className="capitalize">{ticket.category}</span>
            </div>
            <div className="flex items-center">
              <FaClock className="mr-1" />
              <span>{formatDate(ticket.createdAt)}</span>
            </div>
            {ticket.assignee && (
              <div className="flex items-center">
                <FaUser className="mr-1" />
                <span>{ticket.assignee.name}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {showAIIndicator && (
              <div className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                <FaRobot className="mr-1 text-xs" />
                <span className="text-xs font-medium">AI Resolved</span>
              </div>
            )}
            <span className="text-xs text-gray-400">
              #{ticket._id.slice(-6)}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {ticket.resolvedAt && (
              <span>Resolved {formatDate(ticket.resolvedAt)}</span>
            )}
            {ticket.updatedAt && !ticket.resolvedAt && (
              <span>Updated {formatDate(ticket.updatedAt)}</span>
            )}
          </div>
          
          <Link
            to={`/tickets/${ticket._id}`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            View Details
            <FaChevronRight className="ml-2 h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TicketCard;





