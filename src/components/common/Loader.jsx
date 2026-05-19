import React from "react";
import { CircularProgress, Box } from "@mui/material";

const Loader = ({ fullScreen = false, size = 40, sx = {}, color = "primary", ...props }) => {
    if (fullScreen) {
        return (
            <Box
                sx={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    backgroundColor: "var(--bg-glass)",
                    backdropFilter: "blur(4px)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 9999,
                    ...sx
                }}
                {...props}
            >
                <CircularProgress size={size} color={color} />
            </Box>
        );
    }

    return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", ...sx }} {...props}>
            <CircularProgress size={size} color={color} />
        </Box>
    );
};

export default Loader;