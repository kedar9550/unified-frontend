import React, { useEffect, useState } from "react";
import SunLoader from "./SunLoader.jsx";

const Loader = () => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => (prev >= 100 ? 0 : prev + 1));
        }, 40);

        return () => clearInterval(interval);
    }, []);

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(255, 255, 255, 0.85)", // Semi-transparent overlay
                backdropFilter: "blur(4px)", // Premium blur effect
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 9999, // Keep it on top of everything
            }}
        >
            <SunLoader progress={progress} size={130} />
        </div>
    );
};

export default Loader;