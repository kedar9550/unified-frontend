import { Box, Typography } from "@mui/material";

export default function SectionHeader({ title, action }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "flex-start", sm: "center" },
        justifyContent: "space-between",
        gap: { xs: 2, sm: 1 },
        mb: 3,
        background: { xs: "transparent", md: "var(--bg-glass)" },
        backdropFilter: { xs: "none", md: "blur(10px) saturate(180%)" },
        WebkitBackdropFilter: { xs: "none", md: "blur(10px) saturate(180%)" },
        border: { xs: "none", md: "1px solid var(--border-color)" },
        borderRadius: { xs: "8px", md: "16px" },
        p: { xs: 0.5, md: 2 },
        boxShadow: { xs: "none", md: "var(--shadow-premium)" },
        width: "100%",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: { xs: "100%", sm: "auto" } }}>
        {/* Left blue bar */}
        <Box
          sx={{
            width: 4,
            height: 20,
            background: "var(--color-primary)",
            borderRadius: "2px",
            flexShrink: 0,
          }}
        />
        <Typography component="div" fontWeight={600} sx={{ wordBreak: "break-word" }}>{title}</Typography>
      </Box>

      {action && (
        <Box sx={{ width: { xs: "100%", sm: "auto" }, display: "flex", justifyContent: { xs: "flex-start", sm: "flex-end" } }}>
          {action}
        </Box>
      )}
    </Box>
  );
}
