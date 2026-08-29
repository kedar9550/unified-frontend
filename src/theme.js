import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#0b5299", // blue
    },
    secondary: {
      main: "#d06c38", // orange
    },
    warning: {
      main: "#BE9337", // gold
    },
    text: {
      primary: "#0D233B",
    },
  },

  shape: {
    borderRadius: 12,
  },

  typography: {
    fontFamily: "'Product Sans', sans-serif",
    button: {
      textTransform: "none", // Disable default all-caps on buttons
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "50px",
          fontWeight: 700,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        },
        sizeSmall: {
          padding: "5px 16px",
          fontSize: "0.78rem",
        },
        sizeMedium: {
          padding: "8px 24px",
          fontSize: "0.875rem",
        },
        sizeLarge: {
          padding: "12px 32px",
          fontSize: "0.95rem",
        },
        contained: {
          background: "var(--gradient-primary)",
          color: "#ffffff",
          border: "none",
          "&:hover": {
            background: "var(--gradient-primary-hover)",
          },
          "&.Mui-disabled": {
            background: "var(--disabled-bg)",
            color: "var(--disabled-text)",
            boxShadow: "none",
          },
          "&.MuiButton-containedSecondary": {
            background: "linear-gradient(135deg, #d06c38, #b05325)",
            "&:hover": {
              background: "linear-gradient(135deg, #b05325, #903c15)",
            }
          },
          "&.MuiButton-containedSuccess": {
            background: "linear-gradient(135deg, #10B981, #059669)",
            "&:hover": {
              background: "linear-gradient(135deg, #059669, #047857)",
            }
          },
          "&.MuiButton-containedError": {
            background: "linear-gradient(135deg, #EF4444, #DC2626)",
            "&:hover": {
              background: "linear-gradient(135deg, #DC2626, #B91C1C)",
            }
          },
          "&.MuiButton-containedWarning": {
            background: "linear-gradient(135deg, #F59E0B, #D97706)",
            "&:hover": {
              background: "linear-gradient(135deg, #D97706, #B45309)",
            }
          },
          "&.MuiButton-containedInfo": {
            background: "linear-gradient(135deg, #3B82F6, #2563EB)",
            "&:hover": {
              background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
            }
          }
        },
        outlined: {
          border: "1.5px solid var(--color-primary)",
          borderColor: "var(--color-primary)",
          color: "var(--color-primary)",
          background: "transparent",
          "&:hover": {
            border: "1.5px solid var(--color-primary)",
            borderColor: "var(--color-primary)",
            background: "var(--bg-accent-1)",
          },
          "&.MuiButton-outlinedSecondary": {
            border: "1.5px solid #d06c38",
            borderColor: "#d06c38",
            color: "#d06c38",
            "&:hover": {
              border: "1.5px solid #d06c38",
              background: "rgba(208, 108, 56, 0.08)",
            }
          },
          "&.MuiButton-outlinedSuccess": {
            border: "1.5px solid #10B981",
            borderColor: "#10B981",
            color: "#10B981",
            "&:hover": {
              border: "1.5px solid #10B981",
              background: "rgba(16, 185, 129, 0.08)",
            }
          },
          "&.MuiButton-outlinedError": {
            border: "1.5px solid #EF4444",
            borderColor: "#EF4444",
            color: "#EF4444",
            "&:hover": {
              border: "1.5px solid #EF4444",
              background: "rgba(239, 68, 68, 0.08)",
            }
          },
          "&.MuiButton-outlinedWarning": {
            border: "1.5px solid #F59E0B",
            borderColor: "#F59E0B",
            color: "#F59E0B",
            "&:hover": {
              border: "1.5px solid #F59E0B",
              background: "rgba(245, 158, 11, 0.08)",
            }
          },
          "&.MuiButton-outlinedInfo": {
            border: "1.5px solid #3B82F6",
            borderColor: "#3B82F6",
            color: "#3B82F6",
            "&:hover": {
              border: "1.5px solid #3B82F6",
              background: "rgba(59, 130, 246, 0.08)",
            }
          }
        },
        text: {
          color: "var(--color-primary)",
          "&:hover": {
            background: "var(--bg-accent-1)",
          },
          "&.MuiButton-textSecondary": {
            color: "#d06c38",
            "&:hover": {
              background: "rgba(208, 108, 56, 0.08)",
            }
          },
          "&.MuiButton-textSuccess": {
            color: "#10B981",
            "&:hover": {
              background: "rgba(16, 185, 129, 0.08)",
            }
          },
          "&.MuiButton-textError": {
            color: "#EF4444",
            "&:hover": {
              background: "rgba(239, 68, 68, 0.08)",
            }
          }
        }
      },
    },
    MuiMenu: {
      defaultProps: {
        disableScrollLock: true,
      },
    },
    MuiTypography: {
      styleOverrides: {
        overline: {
          textTransform: "capitalize",
        },
      },
    },
  },
});

export default theme;
