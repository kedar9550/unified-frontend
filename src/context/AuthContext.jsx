import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axios";
import { getHighestRole } from "../config/rolePriority";
import { requestForToken } from "../firebase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeRoles = (userData) => {
    if (userData && userData.roles) {
      userData.roles = userData.roles.map(r => {
        const upperRole = r.role ? r.role.toUpperCase() : r.role;
        return { ...r, role: upperRole };
      });
    }
    return userData;
  };

  const logout = async () => {
    try {
      const fcmToken = localStorage.getItem("fcmToken");
      await API.post("/api/employees/logout", { fcmToken });
    } catch (e) {
      console.error("Logout err", e);
    }
    setUser(null);
    setActiveRole(null);
    localStorage.removeItem("user");
    localStorage.removeItem("activeRole");
    localStorage.removeItem("fcmToken");
    localStorage.removeItem("authToken");
    delete API.defaults.headers.common["Authorization"];
  };

  // Initialize from storage on first load
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      let parsedUser = JSON.parse(savedUser);
      parsedUser = normalizeRoles(parsedUser);
      setUser(parsedUser);

      // Refresh user data from server to get latest populated fields
      API.get("/api/employees/me", { skipGlobalLoader: true }).then(res => {
        if (res.data.user) {
          let updatedUser = normalizeRoles(res.data.user);
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      }).catch(err => {
        console.error("Session sync failed:", err);
        // If the session is invalid (401) or the user no longer exists (404), logout
        if (err.response?.status === 401 || err.response?.status === 404) {
          logout();
        }
      });

      let savedRole = localStorage.getItem("activeRole");
      if (savedRole) savedRole = savedRole.toUpperCase();
      if (savedRole === "STAFF") savedRole = "FACULTY";

      if (savedRole) {
        setActiveRole(savedRole);
      } else if (parsedUser.roles && parsedUser.roles.length > 0) {
        const roleStrings = parsedUser.roles.map(r => r.role);
        const highestDefault = getHighestRole(roleStrings);
        setActiveRole(highestDefault);
      }
    }
    setLoading(false);
  }, []);

  const switchRole = (newRole) => {
    
    const upperRole = newRole ? newRole.toUpperCase() : newRole;
    setActiveRole(upperRole);
    localStorage.setItem("activeRole", upperRole);
  };

  const login = async (formData) => {
    try {
      let fcmToken = null;
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error("FCM token request timed out (Edge browser issue)")), 3000)
        );
        fcmToken = await Promise.race([requestForToken(), timeoutPromise]);
        
        if (fcmToken) {
          localStorage.setItem("fcmToken", fcmToken);
        }
      } catch (tokenErr) {
        console.error("Failed to get FCM token during login", tokenErr);
      }

      // Append app context to login details as required by backend
      const payload = { ...formData, app: "UNIFIED_SYSTEM", fcmToken };
      const res = await API.post("/api/employees/login", payload); 

      const token = res.data.token;
      if (token) {
        API.defaults.headers.common.Authorization = `Bearer ${token}`;
        localStorage.setItem('authToken', token);
      }

      let userData = res.data.user;
      userData = normalizeRoles(userData);

      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));

      if (userData.roles && userData.roles.length > 0) {
        const roleStrings = userData.roles.map(r => r.role);
        const defaultRole = getHighestRole(roleStrings);
        setActiveRole(defaultRole);
        localStorage.setItem("activeRole", defaultRole);
      }

      return { success: true };
    } catch (err) {
      throw err;
    }
  };

  const signup = async (formData) => {
    try {
      await API.post("/api/employees/register", formData);
      return { success: true };
    } catch (err) {
      throw err;
    }
  };


  return (
    <AuthContext.Provider value={{ user, activeRole, switchRole, loading, login, signup, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
