import React, { useEffect, useRef, useImperativeHandle } from 'react';
import QRCodeStyling from 'qr-code-styling';
import LogoDarkTheme from '../assets/Logo_Dark_theme.svg';
import LogoDarkThemeRaw from '../assets/Logo_Dark_theme.svg?raw';

const CustomQRCode = React.forwardRef(({
    data,
    size = 280,
    colorType = 'bw', // bw, solid, gradient
    solidColor = '#0b5299',
    gradientColors = ['#d06c38', '#0b5299'],
    backgroundColor = 'white'
}, ref) => {
    const containerRef = useRef(null);
    const qrCode = useRef(null);

    useEffect(() => {
        let dotsOptions = { type: 'rounded', color: '#000000', gradient: null };
        let cornerColor = '#000000';

        if (colorType === 'solid') {
            dotsOptions = { type: 'rounded', color: solidColor, gradient: null };
            cornerColor = solidColor;
        } else if (colorType === 'gradient') {
            dotsOptions = {
                type: 'rounded',
                gradient: {
                    type: 'linear',
                    rotation: 45 * (Math.PI / 180),
                    colorStops: [
                        { offset: 0, color: gradientColors[0] },
                        { offset: 1, color: gradientColors[1] }
                    ]
                }
            };
            cornerColor = gradientColors[1];
        }

        const hasLogo = size >= 100;

        const options = {
            width: size,
            height: size,
            type: 'svg',
            data: data,
            // We inject image manually to prevent the library from cutting a square hole
            image: undefined,
            margin: size < 100 ? 0 : 5,
            qrOptions: {
                typeNumber: 0,
                mode: 'Byte',
                errorCorrectionLevel: hasLogo ? 'H' : 'M'
            },
            imageOptions: {
                hideBackgroundDots: false,
                imageSize: 0.25,
                margin: 0,
                crossOrigin: 'anonymous',
            },
            dotsOptions: dotsOptions,
            backgroundOptions: {
                color: backgroundColor === 'transparent' ? 'transparent' : '#ffffff',
            },
            cornersSquareOptions: {
                type: 'extra-rounded',
                color: cornerColor,
                gradient: null
            },
            cornersDotOptions: {
                type: 'dot',
                color: cornerColor,
                gradient: null
            }
        };

        if (!qrCode.current) {
            qrCode.current = new QRCodeStyling(options);
            if (containerRef.current) {
                qrCode.current.append(containerRef.current);
            }
        } else {
            qrCode.current.update(options);
        }

        // Use SVG mask to create a perfect round cutout without square gaps, supporting transparency
        const timer = setTimeout(() => {
            if (containerRef.current && hasLogo) {
                const svg = containerRef.current.querySelector('svg');

                if (svg) {
                    // Remove existing custom elements if we are updating
                    const existingMask = svg.querySelector('.qr-custom-mask');
                    const existingMaskedGroup = svg.querySelector('.qr-masked-group');
                    const existingImage = svg.querySelector('.qr-custom-logo');

                    if (existingMask) existingMask.remove();
                    if (existingImage) existingImage.remove();
                    if (existingMaskedGroup) {
                        // Unwrap if already masked (for clean update)
                        while (existingMaskedGroup.firstChild) {
                            svg.insertBefore(existingMaskedGroup.firstChild, existingMaskedGroup);
                        }
                        existingMaskedGroup.remove();
                    }

                    const cx = size / 2;
                    const cy = size / 2;
                    // Increase logo size (from 0.25 to 0.32)
                    const imageSizeInPx = size * 0.32;
                    const r = (imageSizeInPx / 2) - 13; // Tight circle padding

                    // 1. Create mask
                    let defs = svg.querySelector('defs');
                    if (!defs) {
                        defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
                        svg.insertBefore(defs, svg.firstChild);
                    }

                    const maskId = `qr-mask-${Date.now()}`;
                    const mask = document.createElementNS("http://www.w3.org/2000/svg", "mask");
                    mask.setAttribute("id", maskId);
                    mask.setAttribute("class", "qr-custom-mask");

                    const maskRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                    maskRect.setAttribute("width", "100%");
                    maskRect.setAttribute("height", "100%");
                    maskRect.setAttribute("fill", "white");

                    const maskCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                    maskCircle.setAttribute("cx", cx);
                    maskCircle.setAttribute("cy", cy);
                    maskCircle.setAttribute("r", r);
                    maskCircle.setAttribute("fill", "black"); // Black hides the dots

                    mask.appendChild(maskRect);
                    mask.appendChild(maskCircle);
                    defs.appendChild(mask);

                    // 2. Wrap all drawing elements (dots, corners) in a masked group
                    const gWrapper = document.createElementNS("http://www.w3.org/2000/svg", "g");
                    gWrapper.setAttribute("mask", `url(#${maskId})`);
                    gWrapper.setAttribute("class", "qr-masked-group");

                    const children = Array.from(svg.children);
                    let bgRectSkipped = false;
                    children.forEach(child => {
                        const tag = child.tagName.toLowerCase();
                        if (tag === 'defs') return;
                        if (tag === 'rect' && !bgRectSkipped) {
                            // Skip the very first rect, which is the background
                            bgRectSkipped = true;
                            return;
                        }
                        gWrapper.appendChild(child);
                    });

                    svg.appendChild(gWrapper);

                    // 3. Append logo on top using base64 so canvas can render it
                    const logoBase64 = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(LogoDarkThemeRaw)));
                    const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
                    img.setAttribute('href', logoBase64);
                    img.setAttribute('x', cx - (imageSizeInPx / 2));
                    img.setAttribute('y', cy - (imageSizeInPx / 2));
                    img.setAttribute('width', imageSizeInPx);
                    img.setAttribute('height', imageSizeInPx);
                    img.setAttribute('class', 'qr-custom-logo');

                    svg.appendChild(img);
                }
            }
        }, 100);

        return () => clearTimeout(timer);
    }, [data, size, colorType, solidColor, gradientColors, backgroundColor]);

    // Expose download method and svg string retrieval to parent
    useImperativeHandle(ref, () => ({
        download: (name = 'qr-code', extension = 'png') => {
            const svg = containerRef.current?.querySelector('svg');
            if (!svg) return;

            // Increase resolution for download by 4x
            const scale = 4;
            const originalWidth = svg.getAttribute('width');
            const originalHeight = svg.getAttribute('height');
            
            const baseWidth = parseInt(originalWidth) || size;
            const baseHeight = parseInt(originalHeight) || size;
            
            svg.setAttribute('width', baseWidth * scale);
            svg.setAttribute('height', baseHeight * scale);

            const svgData = new XMLSerializer().serializeToString(svg);
            
            // Restore original size in DOM
            if (originalWidth) svg.setAttribute('width', originalWidth);
            if (originalHeight) svg.setAttribute('height', originalHeight);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;

                if (backgroundColor !== 'transparent') {
                    ctx.fillStyle = "white";
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                ctx.drawImage(img, 0, 0);

                const pngFile = canvas.toDataURL("image/png");
                const downloadLink = document.createElement("a");
                downloadLink.download = `${name}.png`;
                downloadLink.href = pngFile;
                downloadLink.click();
            };
            img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
        },
        getRawData: async (extension = 'svg') => {
            if (qrCode.current) {
                return await qrCode.current.getRawData(extension);
            }
            return null;
        }
    }));

    return <div ref={containerRef} />;
});

export default CustomQRCode;
