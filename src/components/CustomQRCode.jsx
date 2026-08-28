import React, { useEffect, useRef, useImperativeHandle } from 'react';
import QRCodeStyling from 'qr-code-styling';
import LogoDarkThemeRaw from '../assets/Logo_Dark_theme.svg?raw';
import logoPng from '../assets/logo.png';
import circleLogoWhitePng from '../assets/Circle_logo_white.png';
import circleBlackPng from '../assets/logo-black.png';

const base64Cache = {};
const getBase64FromUrl = async (url) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    if (base64Cache[url]) return base64Cache[url];
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                base64Cache[url] = reader.result;
                resolve(reader.result);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.error('Error converting logo to base64', e);
        return url;
    }
};

const CustomQRCode = React.forwardRef(({
    data,
    size = 280,
    colorType = 'bw', // bw, solid, gradient
    solidColor = '#0b5299',
    gradientColors = ['#d06c38', '#0b5299'],
    backgroundColor = 'white',
    logoStyle = 'default' // 'default', 'logo_png', 'circle_white', 'none'
}, ref) => {
    const containerRef = useRef(null);
    const qrCode = useRef(null);

    useEffect(() => {
        let isCancelled = false;

        let dotsOptions = { type: 'rounded', color: '#000000' };
        let cornersSquareOptions = { type: 'extra-rounded', color: '#000000' };
        let cornersDotOptions = { type: 'dot', color: '#000000' };

        if (colorType === 'solid') {
            dotsOptions = { type: 'rounded', color: solidColor };
            cornersSquareOptions = { type: 'extra-rounded', color: solidColor };
            cornersDotOptions = { type: 'dot', color: solidColor };
        } else if (colorType === 'gradient') {
            const gradientConfig = {
                type: 'linear',
                rotation: 45 * (Math.PI / 180),
                colorStops: [
                    { offset: 0, color: gradientColors[0] },
                    { offset: 1, color: gradientColors[1] }
                ]
            };
            dotsOptions = { type: 'rounded', gradient: gradientConfig };
            cornersSquareOptions = { type: 'extra-rounded', gradient: gradientConfig };
            cornersDotOptions = { type: 'dot', gradient: gradientConfig };
        }

        const hasLogo = size >= 100 && logoStyle !== 'none';

        const options = {
            width: size,
            height: size,
            type: 'svg',
            data: data,
            // We inject image manually to prevent the library from cutting a square hole
            image: undefined,
            margin: hasLogo ? 5 : (size < 100 ? 0 : 5),
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
                color: backgroundColor === 'transparent' ? 'transparent' : (backgroundColor === 'black' ? '#000000' : '#ffffff'),
            },
            cornersSquareOptions: cornersSquareOptions,
            cornersDotOptions: cornersDotOptions
        };

        if (containerRef.current) {
            containerRef.current.innerHTML = '';
        }
        qrCode.current = new QRCodeStyling(options);
        if (containerRef.current) {
            qrCode.current.append(containerRef.current);
        }

        // Use SVG mask to create a perfect round cutout without square gaps, supporting transparency
        const applyLogoAndMask = async () => {
            if (isCancelled) return;
            if (!containerRef.current) return;
            const svg = containerRef.current.querySelector('svg');

            if (svg) {
                // Remove existing custom elements if we are updating
                const existingMask = svg.querySelector('.qr-custom-mask');
                const existingMaskedGroup = svg.querySelector('.qr-masked-group');
                const existingImage = svg.querySelector('.qr-custom-logo');
                const existingWhiteBg = svg.querySelector('.qr-custom-logo-bg');

                if (existingMask) existingMask.remove();
                if (existingImage) existingImage.remove();
                if (existingWhiteBg) existingWhiteBg.remove();
                if (existingMaskedGroup) {
                    // Unwrap if already masked (for clean update)
                    while (existingMaskedGroup.firstChild) {
                        svg.insertBefore(existingMaskedGroup.firstChild, existingMaskedGroup);
                    }
                    existingMaskedGroup.remove();
                }

                if (!hasLogo) return;

                let logoDataUrl = null;

                if (logoStyle === 'default') {
                    logoDataUrl = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(LogoDarkThemeRaw)));
                } else if (logoStyle === 'logo_png') {
                    logoDataUrl = await getBase64FromUrl(logoPng);
                } else if (logoStyle === 'circle_white') {
                    logoDataUrl = await getBase64FromUrl(circleLogoWhitePng);
                } else if (logoStyle === 'circle_black') {
                    logoDataUrl = await getBase64FromUrl(circleBlackPng);
                }

                if (isCancelled || !logoDataUrl) return;

                const cx = size / 2;
                const cy = size / 2;

                // Gold Sun emblem standard mask radius
                const r = (size * 0.16) - (size * (13 / 280));
                
                // PNG logos extend to the edges of their image file.
                // To match Gold Logo's visual size and thick white margin, we scale PNGs down by ~10px relative to the mask.
                const padding = size * (10 / 280);
                let logoDrawWidth = (r * 2) - padding;
                let logoDrawHeight = (r * 2) - padding;

                if (logoStyle === 'default') {
                    // Gold Sun SVG has ~13px padding built inside its viewBox, so outer frame is size * 0.32
                    logoDrawWidth = size * 0.32;
                    logoDrawHeight = size * 0.32;
                }

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

                // 4. Append logo image on top
                const img = document.createElementNS("http://www.w3.org/2000/svg", "image");
                img.setAttribute('href', logoDataUrl);
                img.setAttribute('x', cx - (logoDrawWidth / 2));
                img.setAttribute('y', cy - (logoDrawHeight / 2));
                img.setAttribute('width', logoDrawWidth);
                img.setAttribute('height', logoDrawHeight);
                img.setAttribute('class', 'qr-custom-logo');

                svg.appendChild(img);
            }
        };

        const timer = setTimeout(() => {
            applyLogoAndMask();
        }, 100);

        return () => {
            isCancelled = true;
            clearTimeout(timer);
        };
    }, [data, size, colorType, solidColor, gradientColors, backgroundColor, logoStyle]);

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

    return <div ref={containerRef} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 0 }} />;
});

export default CustomQRCode;
