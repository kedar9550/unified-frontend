import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { BrowserRouter } from "react-router-dom";
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme";
import "./index.css";

import { LoadingProvider } from "./context/LoadingContext";
import { SnackbarProvider } from "./context/SnackbarContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <LoadingProvider>
    <SnackbarProvider>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </SnackbarProvider>
  </LoadingProvider>,
);

