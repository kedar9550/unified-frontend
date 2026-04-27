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
        background: "rgba(255, 255, 255, 0.01)", // Glass background
        backdropFilter: "blur(0px) saturate(180%)",
        WebkitBackdropFilter: "blur(10px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.3)",
        borderRadius: "16px",
        p: { xs: 1.5, sm: 2 }, // Responsive padding
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {/* Left blue bar */}
        <Box
          sx={{
            width: 4,
            height: 20,
            background: "#0b5299",
            borderRadius: "2px",
          }}
        />
        <Typography component="div" fontWeight={600}>{title}</Typography>
      </Box>

      {action && <Box>{action}</Box>}
    </Box>
  );
}
