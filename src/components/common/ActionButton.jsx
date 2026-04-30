import { Button } from "@mui/material";

export default function ActionButton({ children, sx, ...props }) {
  return (
    <Button
      {...props}
      sx={{
        borderRadius: "50px",
        px: 3,
        py: 1,
        background: "var(--gradient-primary)",
        color: "#fff",
        textTransform: "none",
        fontWeight: 700,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-1px)",
          boxShadow: "0 6px 16px rgba(0, 0, 0, 0.15)",
        },
        ...sx, // Merging external styles
      }}
    >
      {children}
    </Button>
  );
}
