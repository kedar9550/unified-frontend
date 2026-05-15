import { Box, Typography, Breadcrumbs, Link } from "@mui/material";

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  action,
  showLogo = true,
}) {
  return (
    <Box
      sx={{
        px: { xs: 2.5, sm: 4 },
        py: { xs: 2.5, sm: 3 },
        borderRadius: "18px",
        background: "var(--bg-glass)",
        backdropFilter: "blur(10px) saturate(150%)",
        WebkitBackdropFilter: "blur(10px) saturate(150%)",
        boxShadow: "var(--shadow-premium)",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", md: "center" },
        gap: 2.5,
        border: "1px solid var(--border-color)",
        position: "relative",
        overflow: showLogo ? "hidden" : "visible",
        marginBottom: "24px",
        width: "100%",
        ...(showLogo && {
          "&::after": {
            content: '""',
            position: "absolute",
            width: "400px",
            height: "100%",
            backgroundImage: "var(--header-svg)",
            backgroundSize: "auto 140%", // Scale dynamically with header height
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            top: 0,
            right: "-200px", // Half visible on the right
            zIndex: 0,
            opacity: 1, // Show actual SVG color
            pointerEvents: "none",
          },
        }),
      }}
    >
      {/* LEFT */}
      <Box sx={{ position: "relative", zIndex: 1, pr: { xs: 2, md: 0 }, textAlign: "left" }}>
        {/* Title */}
        <Typography variant="h4" fontWeight={800} sx={{ color: "var(--text-primary)", fontSize: { xs: "1.5rem", sm: "2rem" }, letterSpacing: "-0.5px" }}>
          {title}
        </Typography>
        {/* Subtitle */}
        {subtitle && (
          <Typography variant="body2" sx={{ color: "var(--text-secondary)", fontWeight: 500, mt: 0.5, opacity: 0.8 }}>
            {subtitle}
          </Typography>
        )}
      </Box>

      {/* RIGHT */}
      <Box sx={{
        position: "relative",
        zIndex: 1,
        width: { xs: "100%", md: "auto" },
        "& > button": { width: "100%" }
      }}>
        {action}
      </Box>
    </Box>
  );
}
