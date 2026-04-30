import { Box, Typography } from "@mui/material";

export default function SectionHeader({ title, action }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        mb: 3,
        background: "var(--bg-glass)",
        backdropFilter: "blur(10px) saturate(180%)",
        WebkitBackdropFilter: "blur(10px) saturate(180%)",
        border: "1px solid var(--border-color)",
        borderRadius: "16px",
        p: { xs: 1.5, sm: 2 },
        boxShadow: "var(--shadow-premium)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {/* Left blue bar */}
        <Box
          sx={{
            width: 4,
            height: 20,
            background: "var(--color-primary)",
            borderRadius: "2px",
          }}
        />
        <Typography component="div" fontWeight={600}>{title}</Typography>
      </Box>

      {action && <Box>{action}</Box>}
    </Box>
  );
}
