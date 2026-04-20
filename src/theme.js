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
  },
});

export default theme;
