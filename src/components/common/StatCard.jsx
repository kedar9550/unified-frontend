import { Box, Typography } from "@mui/material";

export default function StatCard({ title, score, max, icon, glass = false, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        flex: 1,
        width: "100%",
        boxSizing: "border-box",
        p: 3,
        background: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(12px)",
        borderRadius: "20px",
        boxShadow: "0 8px 32px rgba(31, 38, 135, 0.07)",
        border: "1px solid rgba(255, 255, 255, 0.4)",
        transition: "all 0.3s ease-in-out",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "140px",
        cursor: onClick ? "pointer" : "default",

        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 12px 40px rgba(31, 38, 135, 0.12)",
          background: "rgba(255, 255, 255, 0.85)",
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
        <Typography
          variant="subtitle2"
          sx={{
            color: "#555",
            fontWeight: 500,
            fontSize: "0.85rem",
            letterSpacing: "0.02em"
          }}
        >
          {title}
        </Typography>

        {icon && (
          <Box
            sx={{
              opacity: 0.6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
        )}
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 700,
            color: "#003366", // Deep Navy Blue
            fontSize: "2.5rem"
          }}
        >
          {score}
        </Typography>

        {max && (
          <Typography
            variant="caption"
            sx={{ mt: 0.5, display: "block", color: "text.secondary", opacity: 0.8 }}
          >
            Max: {max}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
