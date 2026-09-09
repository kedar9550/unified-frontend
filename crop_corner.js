import fs from 'fs';

const buf = fs.readFileSync('src/assets/corner_reference.png');
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);
console.log('corner_reference dimensions:', width, 'x', height);

const bufRef = fs.readFileSync('src/assets/certificate_reference_1.png');
const wRef = bufRef.readUInt32BE(16);
const hRef = bufRef.readUInt32BE(20);
console.log('certificate_reference_1 dimensions:', wRef, 'x', hRef);
