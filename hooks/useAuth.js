import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("auth_token");
      const storedUser = await AsyncStorage.getItem("user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        await AsyncStorage.setItem("auth_token", data.token);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);

        // Return the token along with success
        return { success: true, token: data.token, user: data.user };
      }

      return { success: false, error: data.error };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  };

  const register = async (requestData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      return data; // The backend already returns { success, error }
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, error: error.message };
    }
  };

  const emailExists = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/check-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error("Email exists error:", error);
      return false;
    }
  };

  const resetPassword = async (email) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Reset password error:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/logout`, { method: "POST" });
      await AsyncStorage.removeItem("auth_token");
      await AsyncStorage.removeItem("user");
      setToken(null);
      setUser(null);
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error: error.message };
    }
  };

  return {
    user,
    token,
    loading,
    login,
    register,
    emailExists,
    resetPassword,
    logout,
    isAuthenticated: !!user,
    isApproved: user?.approved || false,
  };
};
