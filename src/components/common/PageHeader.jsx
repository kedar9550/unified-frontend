import { Box, Typography, IconButton } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useNavigate } from "react-router-dom";

export default function PageHeader({
  title,
  subtitle,
  action,
  icon,
  iconBg = "var(--gradient-primary)",
  showBack = false,
  onBack,
  backPath,
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backPath) {
      navigate(backPath);
    } else {
      navigate("/dashboard");
    }
  };

  const shouldShowBack = showBack || !!onBack || !!backPath;

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
      {/* Decorative Sun SVG wrapper to crop it in half */}
      <Box
        sx={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: "200px",
          overflow: "hidden",
          borderTopRightRadius: "18px",
          borderBottomRightRadius: "18px",
          pointerEvents: "none",
          zIndex: 0,
          display: "block"
        }}
      >
        <Box
          sx={{
            position: "absolute",
            right: 0,
            top: "50%",
            height: "200%",
            aspectRatio: "1",
            transform: "translate(50%, -50%)",
            backgroundImage: "var(--header-svg)",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            opacity: 0.85
          }}
        />
      </Box>

      {/* LEFT */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, position: "relative", zIndex: 1, pr: { xs: 2, md: 0 }, textAlign: "left" }}>
        {shouldShowBack && (
          <IconButton
            onClick={handleBack}
            sx={{
              p: 1,
              bgcolor: "var(--bg-glass)",
              border: "1px solid var(--border-color)",
              color: "var(--text-primary)",
              borderRadius: "12px",
              boxShadow: "var(--shadow-premium-soft)",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
              "&:hover": {
                bgcolor: "var(--color-primary, #3b82f6)",
                color: "#fff",
                transform: "translateX(-4px)",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              },
              "&:active": {
                transform: "translateX(-2px) scale(0.95)",
              }
            }}
          >
            <ArrowBackIcon sx={{ fontSize: 20 }} />
          </IconButton>
        )}

        {icon && (
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: iconBg,
              color: "#ffffff",
              flexShrink: 0,
              boxShadow: "0 6px 16px rgba(190, 147, 55, 0.25)",
              position: "relative",
              overflow: "hidden",
              "&::after": {
                content: '""',
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, rgba(255,255,255,0.25), transparent)",
                borderRadius: "14px",
              },
              "& svg": {
                fontSize: 24,
                color: "#ffffff",
              },
            }}
          >
            {icon}
          </Box>
        )}

        <Box>
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
      </Box>

      {/* RIGHT */}
      <Box sx={{
        position: "relative",
        zIndex: 1,
        width: "auto"
      }}>
        {action}
      </Box>
    </Box>
  );
}
