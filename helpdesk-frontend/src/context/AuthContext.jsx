import { createContext, useContext, useEffect, useState } from "react";
import { loginUser, registerUser, setAuthToken } from "../services/api";
import axios from "axios";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Validate token with backend
  const validateToken = async (token) => {
    try {
      const response = await axios.get('http://localhost:5000/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.user;
    } catch (error) {
      console.error("Token validation failed:", error);
      return null;
    }
  };

  // Load and validate persisted authentication on app start
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setLoading(false);
        return;
      }

      // Validate token with backend
      const validatedUser = await validateToken(token);
      
      if (validatedUser) {
        setUser(validatedUser);
        setAuthToken(token);
      } else {
        // Token is invalid, clear everything
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setAuthToken(null);
      }
      
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async ({ email, password }) => {
    try {
      const response = await loginUser(email, password);
      
      // Store token and user data
      localStorage.setItem("token", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      setAuthToken(response.token);
      setUser(response.user);
      
      return response.user;
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.error || error.message || "Login failed";
      throw new Error(errorMessage);
    }
  };

  // Register function
  const register = async ({ name, email, password }) => {
    try {
      const response = await registerUser({ name, email, password });
      return response;
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error.response?.data?.error || error.message || "Registration failed";
      throw new Error(errorMessage);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthToken(null);
  };

  // Get auth token
  const getToken = () => {
    return localStorage.getItem("token");
  };

  const value = {
    user,
    login,
    register,
    logout,
    getToken,
    loading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};