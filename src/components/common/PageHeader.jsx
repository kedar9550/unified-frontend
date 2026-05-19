import { Box, Typography } from "@mui/material";

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
        overflow: "visible",
        marginBottom: "24px",
        width: "100%",
      }}
    >
      {/* LEFT */}
      <Box sx={{ position: "relative", zIndex: 1, pr: { xs: 2, md: 0 }, textAlign: "left" }}>
        {/* Breadcrumbs removed as per request */}
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
