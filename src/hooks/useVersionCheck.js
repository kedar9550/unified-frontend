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
    try {
      // Append timestamp to avoid cached JSON
      const res = await fetch(`/version.json?t=${new Date().getTime()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      if (!res.ok) return;
      
      const data = await res.json();
      const latestVersion = data.version;

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
              fontFamily: "'Product Sans', sans-serif",
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
              fontFamily: "'Product Sans', sans-serif",
            }
          }
        );
      }
    } catch (err) {
      console.error("Failed to check for updates", err);
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
