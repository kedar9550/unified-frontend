import { Box, Typography } from "@mui/material";

export default function SectionHeader({ title }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        mb: 2,
      }}
    >
      {/* Left blue bar */}
      <Box
        sx={{
          width: 4,
          height: 20,
          background: "#0b5299",
          borderRadius: "2px",
        }}
      />

      <Typography fontWeight={600}>{title}</Typography>
    </Box>
  );
}
