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

// Find outer border coordinates
console.log('Decoded raw image. Dimensions:', width, height);

// Find first solid blue border pixel along diagonal x=y
for (let i = 0; i < 100; i++) {
  const idx = (i * width + i) * 4;
  const r = raw[idx], g = raw[idx+1], b = raw[idx+2];
  if (b > 100 && r < 50) {
    console.log(`Border starts at (${i}, ${i}): RGB(${r}, ${g}, ${b})`);
    break;
  }
}
