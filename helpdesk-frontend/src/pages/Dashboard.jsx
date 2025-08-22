import { useEffect, useState } from "react";
import { getUserTickets } from "../services/api"; 
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";
import TicketCard from "../components/TicketCard";
import { FaTicketAlt, FaCheckCircle, FaHourglassHalf } from "react-icons/fa";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;
    
    // Check if user exists and has ID
    if (!user || !user.id) {
      setLoading(false);
      return;
    }

    const fetchTickets = async () => {
      try {
        setError("");
        console.log("Fetching tickets for user:", user.id);
        
        const response = await getUserTickets(user.id);
        console.log("Received response:", response);
        
        // Handle the response structure { success: true, tickets: [...] }
        const ticketsArray = response.tickets || response || [];
        const tickets = Array.isArray(ticketsArray) ? ticketsArray : [];
        setTickets(tickets);
        
      } catch (err) {
        console.error("Error fetching tickets:", err);
        const errorMessage = err.response?.data?.message || err.message || "Failed to load tickets";
        setError(errorMessage);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user, authLoading]);

  // Show loading while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login prompt if no user
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center bg-white p-8 rounded-lg shadow">
          <p className="text-lg text-gray-600 mb-4">Please login to view your dashboard</p>
          <a 
            href="/login" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  // Show loading while fetching tickets
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  // Calculate stats using backend status values
  const openTickets = tickets.filter(t => t.status === "open").length;
  const triagedTickets = tickets.filter(t => ["triaged", "waiting_human"].includes(t.status)).length;
  const resolvedTickets = tickets.filter(t => ["resolved", "closed"].includes(t.status)).length;

  return (
    <div className="min-h-screen p-6 bg-gray-100">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">
          Welcome back, {user.name}! 👋
        </h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Open Tickets" 
            count={openTickets} 
            icon={<FaTicketAlt />} 
            color="bg-blue-500" 
          />
          <StatCard 
            title="In Progress" 
            count={triagedTickets} 
            icon={<FaHourglassHalf />} 
            color="bg-yellow-500" 
          />
          <StatCard 
            title="Resolved" 
            count={resolvedTickets} 
            icon={<FaCheckCircle />} 
            color="bg-green-500" 
          />
        </div>

        {/* Error handling */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm font-medium">Error loading tickets</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tickets Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Your Recent Tickets</h2>
          <a 
            href="/raise-ticket" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
          >
            + New Ticket
          </a>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white p-12 rounded-xl shadow text-center">
            <div className="text-gray-400 mb-4">
              <FaTicketAlt className="mx-auto text-6xl" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No tickets yet</h3>
            <p className="text-gray-500 mb-6">You haven't raised any support tickets yet.</p>
            <a 
              href="/raise-ticket" 
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Create Your First Ticket
            </a>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.slice(0, 6).map(ticket => (
                <TicketCard key={ticket._id || ticket.id} ticket={ticket} />
              ))}
            </div>

            {/* Show "View All" if there are more tickets */}
            {tickets.length > 6 && (
              <div className="text-center mt-8">
                <a 
                  href="/my-tickets" 
                  className="text-blue-600 hover:text-blue-800 font-medium text-lg"
                >
                  View All Tickets ({tickets.length}) →
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;





