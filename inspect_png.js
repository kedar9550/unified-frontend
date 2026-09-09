import fs from 'fs';
import zlib from 'zlib';

const buf = fs.readFileSync('src/assets/certificate_reference_1.png');
let offset = 8;
const idatChunks = [];
let width, height, bitDepth, colorType;

while (offset < buf.length) {
  const len = buf.readUInt32BE(offset);
  const type = buf.toString('ascii', offset + 4, offset + 8);
  if (type === 'IHDR') {
    width = buf.readUInt32BE(offset + 8);
    height = buf.readUInt32BE(offset + 12);
    bitDepth = buf[offset + 16];
    colorType = buf[offset + 17];
  } else if (type === 'IDAT') {
    idatChunks.push(buf.slice(offset + 8, offset + 8 + len));
  }
  offset += 12 + len;
}

console.log({ width, height, bitDepth, colorType });
