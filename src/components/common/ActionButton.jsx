import { Button } from "@mui/material";

export default function ActionButton({ children, ...props }) {
  return (
    <Button
      {...props}
      sx={{
        borderRadius: "30px",
        px: 3,
        py: 1,
        background: "linear-gradient(135deg, #2a5298, #4facfe)",
        color: "#fff",
        textTransform: "none",
        fontWeight: 600,
        boxShadow: "0 8px 20px rgba(0,0,0,0.2)",

        "&:hover": {
          transform: "translateY(-2px)",
        },
      }}
    >
      {children}
    </Button>
  );
}
