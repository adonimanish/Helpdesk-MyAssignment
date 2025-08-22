// src/services/api.jsx
import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth functions
export const loginUser = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const verifyToken = async () => {
  const response = await api.get('/auth/verify');
  return response.data;
};

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Ticket functions
export const createTicket = async (ticketData) => {
  const response = await api.post('/tickets', ticketData);
  return response.data;
};

export const getUserTickets = async (userId) => {
  const response = await api.get(`/tickets/user/${userId}`);
  // Return the full response with success flag and tickets array
  return response.data;
};

export const getAllTickets = async () => {
  const response = await api.get('/tickets');
  return response.data;
};

export const getTicketById = async (ticketId) => {
  const response = await api.get(`/tickets/${ticketId}`);
  return response.data;
};

export const getTicketSuggestion = async (ticketId) => {
  try {
    const response = await api.get(`/tickets/${ticketId}/suggestion`);
    return response.data;
  } catch (error) {
    console.log('No suggestion available');
    return null;
  }
};

export const submitSuggestionFeedback = async (ticketId, feedback) => {
  const response = await api.post(`/tickets/${ticketId}/suggestion/feedback`, feedback);
  return response.data;
};

export const getTicketAuditLog = async (ticketId) => {
  try {
    const response = await api.get(`/tickets/${ticketId}/audit`);
    return response.data;
  } catch (error) {
    console.log('No audit logs available');
    return { auditLogs: [] };
  }
};

export const replyToTicket = async (ticketId, replyData) => {
  const response = await api.post(`/tickets/${ticketId}/reply`, replyData);
  return response.data;
};

export const assignTicket = async (ticketId, assigneeId) => {
  const response = await api.post(`/tickets/${ticketId}/assign`, { assigneeId });
  return response.data;
};

export { api };
export default api;
