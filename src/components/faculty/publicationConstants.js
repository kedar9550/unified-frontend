export const labelStyle = { 
  fontSize: 11, 
  color: "var(--color-primary)", 
  fontWeight: 800, 
  mb: 0.8, 
  textTransform: "uppercase", 
  letterSpacing: "0.05em",
  opacity: 0.9
};

export const disabledField = {
  "& .MuiInputBase-root": {
    background: "rgba(0,0,0,0.02)",
  },
  "& .MuiInputBase-input.Mui-disabled": { 
    WebkitTextFillColor: "var(--text-secondary)", 
    background: "transparent", 
    opacity: 0.8,
    fontWeight: 600
  },
  "& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline": { 
    borderColor: "var(--border-color)",
    opacity: 0.5
  },
  "body.dark-mode & .MuiInputBase-root": {
    background: "rgba(255,255,255,0.03)",
  }
};

export const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const YEARS = Array.from({ length: 2 }, (_, i) => String(new Date().getFullYear() - i));
