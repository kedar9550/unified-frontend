import React, { useState, useEffect } from "react";
import SunLoader from "./SunLoader.jsx";
import { Box } from "@mui/material";

const Loader = ({ fullScreen = false, size = 130, sx = {}, ...props }) => {
    const [counter, setCounter] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCounter((prev) => (prev >= 200 ? 0 : prev + 1));
        }, 40);
        return () => clearInterval(interval);
    }, []);

    const progress = counter <= 100 ? counter : 200 - counter;

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
                <SunLoader progress={progress} size={size} />
            </Box>
        );
    }

    // Heuristic: If it's a large loader (size >= 50) and not explicitly forced,
    // we assume it's a page-level loader. Since the global loader handles page loads,
    // we suppress this local loader to avoid duplicates.
    if (size >= 50 && !props.forceShow) {
        return null;
    }

    // Small loaders (button spinners, inline loaders) are rendered normally
    return (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", ...sx }} {...props}>
            <SunLoader progress={progress} size={size} />
        </Box>
    );
};

export default Loader;