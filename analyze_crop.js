import fs from 'fs';
import zlib from 'zlib';

const buf = fs.readFileSync('C:/Users/USER/.gemini/antigravity-ide/brain/44788fa0-6b24-4ab0-8f23-5b2c575fa334/.user_uploaded/media_1788917980937.png');
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

console.log('Image dimensions:', w, h);
// Column x = 300
for (let y = 0; y < 35; y++) {
  const idx = (y * w + 300) * 4;
  console.log(`y=${y}: R=${raw[idx]} G=${raw[idx+1]} B=${raw[idx+2]}`);
}

// Check left corner position and dimensions
// Find first blue pixel in top-left
console.log('Top left area scan:');
for (let y = 0; y < 80; y += 5) {
  let line = `y=${y}: `;
  for (let x = 0; x < 90; x += 3) {
    const idx = (y * w + x) * 4;
    const isBlue = raw[idx+2] > 100 && raw[idx] < 80;
    line += isBlue ? '#' : '.';
  }
  console.log(line);
}
