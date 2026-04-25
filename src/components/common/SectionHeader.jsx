import { Box, Typography } from "@mui/material";

export default function SectionHeader({ title, action }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        mb: 2,
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
