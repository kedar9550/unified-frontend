import { createContext, useContext, useState, useEffect } from "react";
import API from "../api/axios";
import { getHighestRole } from "../config/rolePriority";
import { requestForToken } from "../firebase";
import { toast } from "sonner";

const AuthContext = createContext();

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const LAST_ACTIVITY_KEY = "lastActivityTimestamp";

// Detect if running as installed Mobile App / PWA Standalone / Native Wrapper
const isStandaloneMobileApp = () => {
  if (typeof window === "undefined") return false;

  const isStandaloneMatch = window.matchMedia && (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches
  );

  const isIOSStandalone = window.navigator && window.navigator.standalone === true;

  const isNativeWrapper = Boolean(
    window.Capacitor ||
    window.Cordova ||
    window.Android ||
    window.isNativeApp ||
    document.referrer.includes("android-app://")
  );

  return Boolean(isStandaloneMatch || isIOSStandalone || isNativeWrapper);
};

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

  const updateUser = (newUserData) => {
    const updatedUser = normalizeRoles(newUserData);
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const logout = async (reason) => {
    const fcmToken = localStorage.getItem("fcmToken");

    try {
      // Send fcmToken in logout requests to disassociate & remove Firebase ID from DB
      await API.post("/api/employees/logout", { fcmToken }).catch(() => {});
      await API.post("/api/campus-service-request/auth/logout", { fcmToken }).catch(() => {});
    } catch (e) {
      console.error("Logout err", e);
    }

    setUser(null);
    setActiveRole(null);
    localStorage.removeItem("user");
    localStorage.removeItem("activeRole");
    localStorage.removeItem("fcmToken");
    localStorage.removeItem("authToken");
    localStorage.removeItem("campus_student_token");
    localStorage.removeItem("campus_student_profile");
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    delete API.defaults.headers.common["Authorization"];

    if (reason === "inactivity") {
      toast.error("Session expired due to 30 minutes of inactivity. Please sign in again.");
    }
  };

  // Initialize from storage on first load
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      // Skip 30-minute inactivity check if installed as Mobile App (Standalone mode)
      if (!isStandaloneMobileApp()) {
        const savedActivityStr = localStorage.getItem(LAST_ACTIVITY_KEY);
        if (savedActivityStr) {
          const lastActivity = parseInt(savedActivityStr, 10);
          if (Date.now() - lastActivity >= INACTIVITY_TIMEOUT_MS) {
            logout("inactivity");
            setLoading(false);
            return;
          }
        }
      }

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

  // ── Inactivity Auto-Logout Tracker (30 Minutes - Web Only) ──
  useEffect(() => {
    if (!user) return;

    // Do NOT run 30-min inactivity auto-logout if installed as a mobile app
    if (isStandaloneMobileApp()) return;

    let lastRecorded = 0;
    const updateActivity = () => {
      const now = Date.now();
      if (now - lastRecorded > 3000) { // Throttle writes to max once per 3s
        lastRecorded = now;
        localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
      }
    };

    if (!localStorage.getItem(LAST_ACTIVITY_KEY)) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    }

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart", "pointerdown"];
    events.forEach(ev => window.addEventListener(ev, updateActivity, { passive: true }));

    const interval = setInterval(() => {
      const savedTime = localStorage.getItem(LAST_ACTIVITY_KEY);
      if (savedTime) {
        const lastActivity = parseInt(savedTime, 10);
        if (Date.now() - lastActivity >= INACTIVITY_TIMEOUT_MS) {
          logout("inactivity");
        }
      }
    }, 10000);

    return () => {
      events.forEach(ev => window.removeEventListener(ev, updateActivity));
      clearInterval(interval);
    };
  }, [user]);

  const switchRole = (newRole) => {
    const upperRole = newRole ? newRole.toUpperCase() : newRole;
    setActiveRole(upperRole);
    localStorage.setItem("activeRole", upperRole);
  };

  const login = async (formData) => {
    try {
      let fcmToken = localStorage.getItem("fcmToken") || null;
      if (!fcmToken) {
        try {
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("FCM token timeout")), 1000)
          );
          fcmToken = await Promise.race([requestForToken(), timeoutPromise]);
          if (fcmToken) {
            localStorage.setItem("fcmToken", fcmToken);
          }
        } catch (tokenErr) {
          // Ignore token retrieval error so login proceeds instantly
        }
      }

      // Non-blocking background cleanup for previous student session
      const prevStudentToken = localStorage.getItem("campus_student_token");
      if (prevStudentToken || fcmToken) {
        API.post("/api/campus-service-request/auth/logout", { fcmToken }, { skipGlobalLoader: true }).catch(() => {});
      }
      localStorage.removeItem("campus_student_token");
      localStorage.removeItem("campus_student_profile");

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
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());

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
    <AuthContext.Provider value={{ user, activeRole, switchRole, loading, login, signup, logout, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
