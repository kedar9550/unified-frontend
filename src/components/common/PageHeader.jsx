import { Box, Typography, Breadcrumbs, Link } from "@mui/material";

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  action,
}) {
  return (
    <Box
      sx={{
        p: 3,
        borderRadius: "18px",
        background: "rgba(255, 255, 255, 0.25)",
        backdropFilter: "blur(10px) saturate(150%)",
        WebkitBackdropFilter: "blur(10px) saturate(150%)",
        boxShadow: "0 8px 32px rgba(31, 38, 135, 0.05)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        border: "1px solid rgba(255, 255, 255, 0.4)",
        position: "relative",
        overflow: "hidden",
        marginBottom: "20px",
        "&::after": {
          content: '""',
          position: "absolute",
          width: 200,
          height: 200,
          background: "rgba(208,108,56)", // solid orange
          borderRadius: "50%",
          top: -50,
          right: -50,
        },
      }}
    >
      {/* LEFT */}
      <Box sx={{ position: "relative", zIndex: 1, pr: { xs: 2, md: 0 } }}>
        {/* Title */}
        <Typography variant="h4" fontWeight={700} sx={{ color: "#0D233B" }}>
          {title}
        </Typography>

        {/* Subtitle */}
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* RIGHT */}
      <Box sx={{ position: "relative", zIndex: 1 }}>{action}</Box>
    </Box>
  );
}
