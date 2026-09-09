import fs from 'fs';
import zlib from 'zlib';

function readPNG(filePath) {
  const buf = fs.readFileSync(filePath);
  let offset = 8;
  const idat = [];
  let w, h;
  while (offset < buf.length) {
    const len = buf.readUInt32BE(offset);
    const type = buf.toString('ascii', offset + 4, offset + 8);
    if (type === 'IHDR') {
      w = buf.readUInt32BE(offset + 8);
      h = buf.readUInt32BE(offset + 12);
    } else if (type === 'IDAT') {
      idat.push(buf.slice(offset + 8, offset + 8 + len));
    }
    offset += 12 + len;
  }
  const dec = zlib.inflateSync(Buffer.concat(idat));
  const bpp = 4;
  const stride = w * bpp;
  const raw = Buffer.alloc(w * h * bpp);
  let src = 0, dst = 0;
  for (let y = 0; y < h; y++) {
    const f = dec[src++];
    for (let x = 0; x < stride; x++) {
      const byte = dec[src++];
      const a = x >= bpp ? raw[dst + x - bpp] : 0;
      const b = y > 0 ? raw[dst - stride + x] : 0;
      const c = (x >= bpp && y > 0) ? raw[dst - stride + x - bpp] : 0;
      let val = byte;
      if (f === 1) val = (byte + a) & 0xff;
      else if (f === 2) val = (byte + b) & 0xff;
      else if (f === 3) val = (byte + Math.floor((a + b) / 2)) & 0xff;
      else if (f === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        let pr = c;
        if (pa <= pb && pa <= pc) pr = a;
        else if (pb <= pc) pr = b;
        val = (byte + pr) & 0xff;
      }
      raw[dst + x] = val;
    }
    dst += stride;
  }
  return { w, h, raw };
}

function writePNG(w, h, rgbaBuf, outPath) {
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }
  function makeChunk(type, data) {
    const len = data.length;
    const chunk = Buffer.alloc(12 + len);
    chunk.writeUInt32BE(len, 0);
    chunk.write(type, 4, 4, 'ascii');
    data.copy(chunk, 8);
    const crcBuf = Buffer.alloc(4 + len);
    chunk.copy(crcBuf, 0, 4, 8 + len);
    chunk.writeUInt32BE(crc32(crcBuf), 8 + len);
    return chunk;
  }

  const scanlines = Buffer.alloc(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    scanlines[y * (1 + w * 4)] = 0;
    rgbaBuf.copy(scanlines, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4);
  }

  const idatData = zlib.deflateSync(scanlines);
  const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(w, 0);
  ihdrData.writeUInt32BE(h, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));
  const outPNG = Buffer.concat([pngHeader, ihdrChunk, idatChunk, iendChunk]);
  fs.writeFileSync(outPath, outPNG);
}

// 1. Process media_1788917980937.png (User's cropped image)
const cropPath = 'C:/Users/USER/.gemini/antigravity-ide/brain/44788fa0-6b24-4ab0-8f23-5b2c575fa334/.user_uploaded/media_1788917980937.png';
const cropImg = readPNG(cropPath);
console.log('User crop image:', cropImg.w, 'x', cropImg.h);

// Let's find left flourish bounding box in cropImg:
// Left border inner edge:
let borderLeft = 0;
for (let x = 0; x < 50; x++) {
  const idx = (50 * cropImg.w + x) * 4;
  if (cropImg.raw[idx + 2] > 100 && cropImg.raw[idx] < 60) {
    // blue border
  } else if (cropImg.raw[idx] > 200 && cropImg.raw[idx + 1] > 200 && cropImg.raw[idx + 2] > 200) {
    borderLeft = x;
    break;
  }
}
let borderTop = 0;
for (let y = 0; y < 50; y++) {
  const idx = (y * cropImg.w + 100) * 4;
  if (cropImg.raw[idx + 2] > 100 && cropImg.raw[idx] < 60) {
    // blue border
  } else if (cropImg.raw[idx] > 200 && cropImg.raw[idx + 1] > 200 && cropImg.raw[idx + 2] > 200) {
    borderTop = y;
    break;
  }
}
console.log('Border inner edges:', { borderLeft, borderTop });

// Search for flourish pixels in top-left
let minX = 999, minY = 999, maxX = 0, maxY = 0;
for (let y = borderTop; y < cropImg.h; y++) {
  for (let x = borderLeft; x < 180; x++) {
    const idx = (y * cropImg.w + x) * 4;
    const r = cropImg.raw[idx];
    const g = cropImg.raw[idx + 1];
    const b = cropImg.raw[idx + 2];
    if (b > 70 && (b - r > 20)) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
}
console.log('Left flourish in user crop:', { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 });

// Also check right flourish in user crop:
let rMinX = 999, rMinY = 999, rMaxX = 0, rMaxY = 0;
for (let y = borderTop; y < cropImg.h; y++) {
  for (let x = cropImg.w - 180; x < cropImg.w - borderLeft; x++) {
    const idx = (y * cropImg.w + x) * 4;
    const r = cropImg.raw[idx];
    const g = cropImg.raw[idx + 1];
    const b = cropImg.raw[idx + 2];
    if (b > 70 && (b - r > 20)) {
      if (x < rMinX) rMinX = x;
      if (y < rMinY) rMinY = y;
      if (x > rMaxX) rMaxX = x;
      if (y > rMaxY) rMaxY = y;
    }
  }
}
console.log('Right flourish in user crop:', { rMinX, rMinY, rMaxX, rMaxY, w: rMaxX - rMinX + 1, h: rMaxY - rMinY + 1 });

// Now let's extract the left flourish directly into a crisp PNG
// We add 1px padding
const pad = 1;
const outW = (maxX - minX + 1) + pad * 2;
const outH = (maxY - minY + 1) + pad * 2;
const outBuf = Buffer.alloc(outW * outH * 4);

// Target color is #154487 -> (21, 68, 135)
for (let y = 0; y < outH; y++) {
  for (let x = 0; x < outW; x++) {
    const srcX = minX - pad + x;
    const srcY = minY - pad + y;
    const dstIdx = (y * outW + x) * 4;
    if (srcX < 0 || srcX >= cropImg.w || srcY < 0 || srcY >= cropImg.h) {
      continue;
    }
    const srcIdx = (srcY * cropImg.w + srcX) * 4;
    const r = cropImg.raw[srcIdx];
    const g = cropImg.raw[srcIdx + 1];
    const b = cropImg.raw[srcIdx + 2];

    const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
    if (brightness > 240) {
      outBuf[dstIdx + 3] = 0;
    } else {
      const alpha = Math.min(255, Math.max(0, Math.round((255 - brightness) * 1.6)));
      outBuf[dstIdx] = 21;
      outBuf[dstIdx + 1] = 68;
      outBuf[dstIdx + 2] = 135;
      outBuf[dstIdx + 3] = alpha;
    }
  }
}

writePNG(outW, outH, outBuf, 'src/assets/exact_corner_flourish.png');
console.log(`Saved exact_corner_flourish.png (${outW}x${outH}) from user reference!`);
