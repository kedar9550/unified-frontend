import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axios";
import { getHighestRole } from "../config/rolePriority";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const normalizeRoles = (userData) => {
    if (userData && userData.roles) {
      userData.roles = userData.roles.map(r => {
        const upperRole = r.role ? r.role.toUpperCase() : r.role;
        return upperRole === "STAFF" ? { ...r, role: "FACULTY", name: "FACULTY" } : { ...r, role: upperRole };
      });
    }
    return userData;
  };

  // Initialize from storage on first load
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      let parsedUser = JSON.parse(savedUser);
      parsedUser = normalizeRoles(parsedUser);
      setUser(parsedUser);

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
      // Append app context to login details as required by backend
      const payload = { ...formData, app: "UNIFIED_SYSTEM" };
      const res = await API.post("/api/employees/login", payload); 

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
      const res = await API.post("/api/employees/register", formData);
      let userData = res.data.user;
      userData = normalizeRoles(userData);
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData));
      return { success: true };
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    try {
      await API.post("/api/employees/logout");
    } catch (e) {
      console.error("Logout err", e);
    }
    setUser(null);
    setActiveRole(null);
    localStorage.removeItem("user");
    localStorage.removeItem("activeRole");
  };

  return (
    <AuthContext.Provider value={{ user, activeRole, switchRole, loading, login, signup, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
