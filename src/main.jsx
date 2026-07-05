import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import "./index.css";

import { LoadingProvider } from "./context/LoadingContext";
import { SocketProvider } from "./context/SocketContext";
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

