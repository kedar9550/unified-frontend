import React, { useEffect, useRef } from "react";

const Background = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        // 🌊 Smooth random generator (pseudo noise)
        function noise(x) {
            return Math.sin(x) * 0.5 + Math.sin(x * 0.5) * 0.3;
        }

        let layers = [
            { amp: 60, freq: 0.002, speed: 0.01, offset: 0, opacity: 0.25 },
            { amp: 80, freq: 0.0015, speed: 0.008, offset: 100, opacity: 0.2 },
            { amp: 100, freq: 0.001, speed: 0.006, offset: 200, opacity: 0.15 }
        ];

        const drawLayer = (layer) => {
            ctx.beginPath();
            ctx.moveTo(0, canvas.height);

            for (let x = 0; x <= canvas.width; x++) {
                let y =
                    canvas.height / 2 +
                    noise(x * layer.freq + layer.offset) * layer.amp;

                ctx.lineTo(x, y);
            }

            ctx.lineTo(canvas.width, canvas.height);
            ctx.closePath();

            // 🌈 soft gradient fill
            let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, `rgba(255,255,255,${layer.opacity})`);
            gradient.addColorStop(1, `rgba(255,255,255,0)`);

            ctx.fillStyle = gradient;

            // ✨ glow effect
            ctx.shadowBlur = 40;
            ctx.shadowColor = "rgba(255,255,255,0.5)";

            ctx.fill();
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            layers.forEach(layer => {
                drawLayer(layer);
                layer.offset += layer.speed;
            });

            requestAnimationFrame(animate);
        };

        const animationId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <div style={{
            position: "fixed",
            inset: 0,
            zIndex: -1,
            margin: 0,
            overflow: "hidden",
            background: "radial-gradient(circle at 50% 30%, #e8edff, #7aa0e8)",
        }}>
            <canvas
                ref={canvasRef}
                style={{
                    display: "block",
                }}
            />
        </div>
    );
};

export default Background;