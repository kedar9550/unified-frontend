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
        background: "var(--bg-glass)",
        backdropFilter: "blur(12px)",
        borderRadius: "20px",
        boxShadow: "var(--shadow-premium)",
        border: "1px solid var(--border-color)",
        transition: "all 0.3s ease-in-out",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "140px",
        cursor: onClick ? "pointer" : "default",

        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "var(--shadow-premium)",
          background: "var(--bg-panel)",
          borderColor: "var(--color-primary)",
        },
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
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

      <Box sx={{ mt: 2 }}>
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
