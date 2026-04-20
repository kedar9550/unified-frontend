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
        background:
          "linear-gradient(135deg, rgba(11,82,153,0.15), rgba(190,147,55,0.1))",
        backdropFilter: "blur(12px)",
        boxShadow: "0 10px 30px rgba(0,0,0,0.1)",

        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        border: "1px solid rgba(255,255,255,0.4)",
        position: "relative",
        overflow: "hidden",
        marginBottom: "20px",
        "&::after": {
          content: '""',
          position: "absolute",
          width: 200,
          height: 200,
          background: "rgba(208,108,56)", //  orange
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
