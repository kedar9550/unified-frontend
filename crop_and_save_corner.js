import fs from 'fs';
import zlib from 'zlib';

const buf = fs.readFileSync('src/assets/certificate_reference_1.png');
let offset = 8;
const idatChunks = [];
let width, height;

while (offset < buf.length) {
  const len = buf.readUInt32BE(offset);
  const type = buf.toString('ascii', offset + 4, offset + 8);
  if (type === 'IHDR') {
    width = buf.readUInt32BE(offset + 8);
    height = buf.readUInt32BE(offset + 12);
  } else if (type === 'IDAT') {
    idatChunks.push(buf.slice(offset + 8, offset + 8 + len));
  }
  offset += 12 + len;
}

const decompressed = zlib.inflateSync(Buffer.concat(idatChunks));
const bytesPerPixel = 4;
const stride = width * bytesPerPixel;
const raw = Buffer.alloc(width * height * bytesPerPixel);
let srcOffset = 0;
let dstOffset = 0;

for (let y = 0; y < height; y++) {
  const filter = decompressed[srcOffset++];
  for (let x = 0; x < stride; x++) {
    const byte = decompressed[srcOffset++];
    const a = x >= bytesPerPixel ? raw[dstOffset + x - bytesPerPixel] : 0;
    const b = y > 0 ? raw[dstOffset - stride + x] : 0;
    const c = (x >= bytesPerPixel && y > 0) ? raw[dstOffset - stride + x - bytesPerPixel] : 0;

    let val = byte;
    if (filter === 1) {
      val = (byte + a) & 0xff;
    } else if (filter === 2) {
      val = (byte + b) & 0xff;
    } else if (filter === 3) {
      val = (byte + Math.floor((a + b) / 2)) & 0xff;
    } else if (filter === 4) {
      const p = a + b - c;
      const pa = Math.abs(p - a);
      const pb = Math.abs(p - b);
      const pc = Math.abs(p - c);
      let pr = c;
      if (pa <= pb && pa <= pc) pr = a;
      else if (pb <= pc) pr = b;
      val = (byte + pr) & 0xff;
    }
    raw[dstOffset + x] = val;
  }
  dstOffset += stride;
}

// Find inner edge of top-left border
// Along x=200 (avoiding corner flourish):
let borderTop = 0, borderLeft = 0;
for (let y = 0; y < 100; y++) {
  const idx = (y * width + 200) * 4;
  if (raw[idx+2] > 100 && raw[idx] < 50) {
    borderTop = y;
    break;
  }
}
let borderBottomEdge = 0;
for (let y = borderTop; y < 100; y++) {
  const idx = (y * width + 200) * 4;
  if (raw[idx] > 200 && raw[idx+1] > 200 && raw[idx+2] > 200) {
    borderBottomEdge = y;
    break;
  }
}

for (let x = 0; x < 100; x++) {
  const idx = (200 * width + x) * 4;
  if (raw[idx+2] > 100 && raw[idx] < 50) {
    borderLeft = x;
    break;
  }
}
let borderRightEdge = 0;
for (let x = borderLeft; x < 100; x++) {
  const idx = (200 * width + x) * 4;
  if (raw[idx] > 200 && raw[idx+1] > 200 && raw[idx+2] > 200) {
    borderRightEdge = x;
    break;
  }
}

console.log({ borderTop, borderBottomEdge, borderLeft, borderRightEdge });

// The corner flourish is inside x from borderRightEdge to ~borderRightEdge + 100, y from borderBottomEdge to ~borderBottomEdge + 100
// Let's find the bounding box of blue pixels in the corner region
const startX = borderRightEdge;
const startY = borderBottomEdge;
let maxX = startX;
let maxY = startY;

for (let y = startY; y < startY + 120; y++) {
  for (let x = startX; x < startX + 120; x++) {
    const idx = (y * width + x) * 4;
    const r = raw[idx], g = raw[idx+1], b = raw[idx+2];
    // Check if blue flourish pixel
    if (b > 90 && (b - r > 30)) {
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
}

console.log({ startX, startY, maxX, maxY, cropW: maxX - startX + 2, cropH: maxY - startY + 2 });

const cropW = maxX - startX + 4;
const cropH = maxY - startY + 4;
const cropRGBA = Buffer.alloc(cropW * cropH * 4);

// Target royal blue color: #154487 -> (21, 68, 135)
for (let y = 0; y < cropH; y++) {
  for (let x = 0; x < cropW; x++) {
    const srcX = startX + x;
    const srcY = startY + y;
    const srcIdx = (srcY * width + srcX) * 4;
    const dstIdx = (y * cropW + x) * 4;

    const r = raw[srcIdx];
    const g = raw[srcIdx+1];
    const b = raw[srcIdx+2];

    // Compute lightness / alpha
    // Pure white is (255, 255, 255) -> alpha 0
    // Dark blue is (~25, ~70, ~135) -> alpha 255
    const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
    if (brightness > 245) {
      cropRGBA[dstIdx] = 21;
      cropRGBA[dstIdx+1] = 68;
      cropRGBA[dstIdx+2] = 135;
      cropRGBA[dstIdx+3] = 0;
    } else {
      const alpha = Math.min(255, Math.max(0, Math.round((255 - brightness) * 1.5)));
      cropRGBA[dstIdx] = 21;
      cropRGBA[dstIdx+1] = 68;
      cropRGBA[dstIdx+2] = 135;
      cropRGBA[dstIdx+3] = alpha;
    }
  }
}

// Write PNG
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1));
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

const scanlines = Buffer.alloc(cropH * (1 + cropW * 4));
for (let y = 0; y < cropH; y++) {
  scanlines[y * (1 + cropW * 4)] = 0;
  cropRGBA.copy(scanlines, y * (1 + cropW * 4) + 1, y * cropW * 4, (y + 1) * cropW * 4);
}

const idatData = zlib.deflateSync(scanlines);

const pngHeader = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const ihdrData = Buffer.alloc(13);
ihdrData.writeUInt32BE(cropW, 0);
ihdrData.writeUInt32BE(cropH, 4);
ihdrData[8] = 8; // bit depth
ihdrData[9] = 6; // RGBA
ihdrData[10] = 0; // compression
ihdrData[11] = 0; // filter
ihdrData[12] = 0; // interlace

const ihdrChunk = makeChunk('IHDR', ihdrData);
const idatChunk = makeChunk('IDAT', idatData);
const iendChunk = makeChunk('IEND', Buffer.alloc(0));

const outPNG = Buffer.concat([pngHeader, ihdrChunk, idatChunk, iendChunk]);
fs.writeFileSync('src/assets/exact_corner_flourish.png', outPNG);
console.log('Successfully saved src/assets/exact_corner_flourish.png!');
