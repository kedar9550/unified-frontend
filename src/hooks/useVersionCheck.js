import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

const CACHE_VERSION_KEY = 'app_version';

export const useVersionCheck = () => {
  const location = useLocation();
  const [currentVersion, setCurrentVersion] = useState(() => {
    return localStorage.getItem(CACHE_VERSION_KEY) || null;
  });

  const checkForUpdates = async () => {
    // Skip version checking in dev mode (Vite HMR handles updates)
    if (import.meta.env.DEV) return;

    try {
      // Append timestamp to avoid cached JSON
      const res = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!res.ok) return;
      
      const data = await res.json();
      const latestVersion = data?.version;
      if (!latestVersion) return;

      if (!currentVersion) {
        // First time loading the app with versioning
        setCurrentVersion(latestVersion);
        localStorage.setItem(CACHE_VERSION_KEY, latestVersion);
      } else if (currentVersion !== latestVersion) {
        // Version mismatch, show toast!
        toast.info(
          "A new version of the application is available. Click to update.",
          {
            id: "version-update-toast",
            duration: Infinity, // Don't auto dismiss
            style: {
              fontFamily: "'Stem', sans-serif",
            },
            action: {
              label: "Update",
              onClick: () => {
                localStorage.setItem(CACHE_VERSION_KEY, latestVersion);
                window.location.reload(true);
              },
            },
            actionButtonStyle: {
              background: "var(--gradient-primary)",
              color: "white",
              border: "none",
              fontFamily: "'Stem', sans-serif",
            }
          }
        );
      }
    } catch (err) {
      // Silently handle network/server errors during restarts or offline state
    }
  };

  // Check for updates every time the user navigates to a new page
  useEffect(() => {
    checkForUpdates();
  }, [location.pathname]);

  // Check for updates when the user switches back to the tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};
