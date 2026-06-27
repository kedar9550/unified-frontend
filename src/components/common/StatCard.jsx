import { Box, Typography } from "@mui/material";

export default function StatCard({ title, score, max, icon, color = "var(--color-primary)", onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        flex: 1,
        width: "100%",
        boxSizing: "border-box",
        p: 2.5,
        background: "var(--bg-panel)",
        borderRadius: "16px",
        boxShadow: "var(--shadow-premium)",
        border: "1px solid var(--border-color)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "160px",
        height: "160px",
        cursor: onClick ? "pointer" : "default",
        position: "relative",
        overflow: "hidden",

        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
        },

        "&::after": {
          content: '""',
          position: "absolute",
          top: 0,
          right: 0,
          width: "120px",
          height: "120px",
          background: `radial-gradient(circle at top right, ${color}25, transparent 70%)`,
          zIndex: 0,
          pointerEvents: "none"
        }
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", position: "relative", zIndex: 1 }}>
        <Typography
          variant="subtitle2"
          sx={{
            color: "var(--text-secondary)",
            fontWeight: 600,
            fontSize: "0.85rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}
        >
          {title}
        </Typography>

        {icon && (
          <Box
            sx={{
              color: "var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
        )}
      </Box>

      <Box sx={{ mt: 2, position: "relative", zIndex: 1 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            color: "var(--text-primary)",
            fontSize: "2.5rem"
          }}
        >
          {score}
        </Typography>

        {max && (
          <Typography
            variant="caption"
            sx={{ mt: 0.5, display: "block", color: "var(--text-secondary)", fontWeight: 500 }}
          >
            Max Score: {max}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
