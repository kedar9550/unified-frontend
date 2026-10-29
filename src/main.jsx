import React from "react";
import ReactDOM from "react-dom/client";
import '@fontsource-variable/google-sans';
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import "./index.css";

import { LoadingProvider } from "./context/LoadingContext";
import { SocketProvider } from "./context/SocketContext";
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with auto-update
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (reg) {
      // Check for updates every 60 minutes
      setInterval(() => {
        reg.update();
      }, 60 * 60 * 1000);
    }
  },
});
ReactDOM.createRoot(document.getElementById("root")).render(
  <LoadingProvider>
      <AuthProvider>
        <SocketProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ThemeProvider>
        </SocketProvider>
      </AuthProvider>
  </LoadingProvider>,
);

