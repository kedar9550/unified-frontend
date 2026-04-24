import React, { useEffect, useRef } from "react";

const Background = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d", { alpha: false });
        let width, height;

        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        // Majestically sweeping, low-frequency ethereal waves
        const waves = [
            { yBase: 0.15, amp: 200, freq: 0.0004, speed: 0.0008, offset: 0, color: "255, 240, 245", glow: 0.8 },
            { yBase: 0.35, amp: 250, freq: 0.0003, speed: 0.0012, offset: 2.5, color: "230, 240, 255", glow: 0.6 },
            { yBase: 0.55, amp: 180, freq: 0.0005, speed: 0.001, offset: 5, color: "250, 245, 255", glow: 0.5 },
            { yBase: 0.75, amp: 300, freq: 0.0003, speed: 0.0007, offset: 1.5, color: "220, 235, 255", glow: 0.7 },
            { yBase: 0.95, amp: 150, freq: 0.0006, speed: 0.0015, offset: 4, color: "245, 250, 255", glow: 0.9 },
        ];

        let time = 0;

        const animate = () => {
            // 1. Draw Ethereal Base Background
            const bgGradient = ctx.createRadialGradient(width * 0.5, -height * 0.1, 0, width * 0.5, height * 0.2, height * 1.5);
            bgGradient.addColorStop(0, "#fff5f8"); // Pale warm pinkish white
            bgGradient.addColorStop(0.2, "#dbe4ff"); // Soft lavender/blue
            bgGradient.addColorStop(0.5, "#9cbbf2"); // Sky blue
            bgGradient.addColorStop(0.8, "#6a9cf0"); // Richer blue
            bgGradient.addColorStop(1, "#4075cc"); // Deepest blue

            ctx.fillStyle = bgGradient;
            ctx.fillRect(0, 0, width, height);

            ctx.globalCompositeOperation = "screen";

            // 2. Draw majestic sweeping waves
            waves.forEach((wave) => {
                ctx.beginPath();
                ctx.moveTo(0, height);

                let startY = 0;
                let points = [];

                // Very smooth sine curve, no jagged interference noise
                for (let x = 0; x <= width + 10; x += 10) { // +10 ensures it draws off-screen safely
                    // Large, elegant sine wave
                    const y = (height * wave.yBase) 
                            + Math.sin(x * wave.freq + time * wave.speed + wave.offset) * wave.amp;
                    
                    if (x === 0) startY = y;
                    points.push({x, y});
                    ctx.lineTo(x, y);
                }

                ctx.lineTo(width, height);
                ctx.closePath();

                // Fill translucent body
                const fillGradient = ctx.createLinearGradient(0, height * wave.yBase - wave.amp, 0, height);
                fillGradient.addColorStop(0, `rgba(${wave.color}, 0.25)`);
                fillGradient.addColorStop(0.4, `rgba(${wave.color}, 0.08)`);
                fillGradient.addColorStop(1, `rgba(${wave.color}, 0)`);
                
                ctx.fillStyle = fillGradient;
                ctx.fill();

                // Draw glowing crest (optical multi-stroke glow)
                ctx.beginPath();
                ctx.moveTo(0, startY);
                points.forEach(p => ctx.lineTo(p.x, p.y));
                
                // Outer massive soft glow
                ctx.lineWidth = 25;
                ctx.strokeStyle = `rgba(255, 255, 255, ${wave.glow * 0.05})`;
                ctx.stroke();

                // Medium glow
                ctx.lineWidth = 8;
                ctx.strokeStyle = `rgba(255, 255, 255, ${wave.glow * 0.2})`;
                ctx.stroke();

                // Core bright line
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = `rgba(255, 255, 255, ${wave.glow * 0.9})`;
                ctx.stroke();
            });

            // 3. Draw subtle magical flares/stars (like the tiny light bursts in the image)
            const numStars = 6;
            for(let i=0; i<numStars; i++) {
                let sx = (Math.sin(i * 123.45 + time * 0.002) * 0.5 + 0.5) * width;
                let sy = (Math.cos(i * 678.90 + time * 0.001) * 0.5 + 0.5) * height;
                let opacity = Math.sin(time * 0.02 + i) * 0.4 + 0.4;
                
                if(opacity > 0) {
                    const flare = ctx.createRadialGradient(sx, sy, 0, sx, sy, 40);
                    flare.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
                    flare.addColorStop(0.2, `rgba(255, 240, 250, ${opacity * 0.3})`);
                    flare.addColorStop(1, "rgba(255, 255, 255, 0)");
                    
                    ctx.fillStyle = flare;
                    ctx.fillRect(sx - 40, sy - 40, 80, 80);
                }
            }

            ctx.globalCompositeOperation = "source-over";

            time += 1;
            requestAnimationFrame(animate);
        };

        const animationId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener("resize", resize);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                display: "block",
                position: "fixed",
                inset: 0,
                zIndex: -1,
                width: "100vw",
                height: "100vh",
            }}
        />
    );
};

export default Background;