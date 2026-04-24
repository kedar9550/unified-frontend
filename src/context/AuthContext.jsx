import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize from storage on first load
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (formData) => {
    try {
      // Append app context to login details as required by backend
      const payload = { ...formData, app: "UNIFIED_SYSTEM" };
      const res = await API.post("/api/users/login", payload);
      
      const userData = res.data.user;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      throw err;
    }
  };

  const signup = async (formData) => {
    try {
      const res = await API.post("/api/users/register", formData);
      const userData = res.data.user;
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    try {
      await API.post("/api/users/logout");
    } catch (e) {
      console.error("Logout err", e);
    }
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
