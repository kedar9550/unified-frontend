import React, { useEffect, useState } from "react";
import SunLoader from "./SunLoader.jsx";

const Loader = () => {
    const [counter, setCounter] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCounter((prev) => (prev >= 200 ? 0 : prev + 1));
        }, 40);

        return () => clearInterval(interval);
    }, []);

    const progress = counter <= 100 ? counter : 200 - counter;

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "var(--bg-glass)", // Theme-aware overlay
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