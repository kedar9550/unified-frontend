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

const { w, h, raw } = readPNG('src/assets/certificate_reference_1.png');
console.log('Original image loaded:', w, 'x', h);

// The top border is from y=4 to y=20. Inner edge is at y=21.
// The left border is from x=7 to x=20. Inner edge is at x=21.
// Let's find the exact bounding box of the corner flourish, excluding border lines:
// Border inner is at startX = 22, startY = 22.
let minX = 999, minY = 999, maxX = 0, maxY = 0;
for (let y = 22; y <= 90; y++) {
  for (let x = 22; x <= 90; x++) {
    const idx = (y * w + x) * 4;
    const r = raw[idx], g = raw[idx+1], b = raw[idx+2];
    if (b > 75 && (b - r > 20)) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
}

console.log('Exact corner bounds:', { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 });

// We include a 1px border around it
const pad = 1;
const cropW = (maxX - minX + 1) + pad * 2;
const cropH = (maxY - minY + 1) + pad * 2;
const cropBuf = Buffer.alloc(cropW * cropH * 4);

// Target color #154487 = [21, 68, 135]
for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const srcX = (minX - pad) + x;
    const srcY = (minY - pad) + y;
    const dstIdx = (y * cropW + x) * 4;
    if (srcX < 0 || srcX >= w || srcY < 0 || srcY >= h) continue;

    const srcIdx = (srcY * w + srcX) * 4;
    const r = raw[srcIdx], g = raw[srcIdx+1], b = raw[srcIdx+2];

    const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
    if (brightness > 240) {
      cropBuf[dstIdx + 3] = 0;
    } else {
      const alpha = Math.min(255, Math.max(0, Math.round((255 - brightness) * 1.55)));
      cropBuf[dstIdx] = 21;
      cropBuf[dstIdx + 1] = 68;
      cropBuf[dstIdx + 2] = 135;
      cropBuf[dstIdx + 3] = alpha;
    }
  }
}

writePNG(cropW, cropH, cropBuf, 'src/assets/exact_corner_flourish.png');
console.log('Saved src/assets/exact_corner_flourish.png:', cropW, 'x', cropH);

// Now generate a 4x supersampled HD version with smooth cubic/bilinear interpolation
const scale = 4;
const hdW = cropW * scale;
const hdH = cropH * scale;
const hdBuf = Buffer.alloc(hdW * hdH * 4);

for (let hy = 0; hy < hdH; hy++) {
  for (let hx = 0; hx < hdW; hx++) {
    const srcX = hx / scale;
    const srcY = hy / scale;
    const x0 = Math.floor(srcX);
    const y0 = Math.floor(srcY);
    const x1 = Math.min(cropW - 1, x0 + 1);
    const y1 = Math.min(cropH - 1, y0 + 1);
    const fx = srcX - x0;
    const fy = srcY - y0;

    const a00 = cropBuf[(y0 * cropW + x0) * 4 + 3];
    const a10 = cropBuf[(y0 * cropW + x1) * 4 + 3];
    const a01 = cropBuf[(y1 * cropW + x0) * 4 + 3];
    const a11 = cropBuf[(y1 * cropW + x1) * 4 + 3];

    const alpha = (a00 * (1 - fx) * (1 - fy) +
                   a10 * fx * (1 - fy) +
                   a01 * (1 - fx) * fy +
                   a11 * fx * fy);

    const hdDst = (hy * hdW + hx) * 4;
    hdBuf[hdDst] = 21;
    hdBuf[hdDst + 1] = 68;
    hdBuf[hdDst + 2] = 135;
    hdBuf[hdDst + 3] = Math.round(alpha);
  }
}

writePNG(hdW, hdH, hdBuf, 'src/assets/exact_corner_flourish_hd.png');
console.log('Saved src/assets/exact_corner_flourish_hd.png:', hdW, 'x', hdH);
