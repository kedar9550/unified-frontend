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
        px: { xs: 2.5, sm: 4 },
        py: { xs: 2.5, sm: 3 },
        borderRadius: "18px",
        background: "rgba(255, 255, 255, 0.25)",
        backdropFilter: "blur(10px) saturate(150%)",
        WebkitBackdropFilter: "blur(10px) saturate(150%)",
        boxShadow: "0 8px 32px rgba(31, 38, 135, 0.05)",
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2.5,
        border: "1px solid rgba(255, 255, 255, 0.4)",
        position: "relative",
        overflow: "hidden",
        marginBottom: "24px",
        width: "100%",
        "&::after": {
          content: '""',
          position: "absolute",
          width: "400px",
          height: "100%",
          backgroundImage: "var(--header-svg)",
          backgroundSize: "auto 140%", // Perfectly fit the sun graphic height to the header height
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center", // Center the sun within the pseudo-element
          top: 0,
          right: "-200px", // Position the center of the sun at the right edge
          zIndex: 0,
          pointerEvents: "none",
        },
      }}
    >
      {/* LEFT */}
      <Box sx={{ position: "relative", zIndex: 1, pr: { xs: 2, md: 0 } }}>
        {/* Title */}
        <Typography variant="h4" fontWeight={700} sx={{ color: "var(--text-primary)" }}>
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
      <Box sx={{ 
        position: "relative", 
        zIndex: 1, 
        width: { xs: "100%", sm: "auto" },
        "& > button": { width: "100%" } 
      }}>
        {action}
      </Box>
    </Box>
  );
}
