const { svgPathBbox } = require('svg-path-bbox');
const fs = require('fs');
const data = fs.readFileSync('src/assets/Loader.svg', 'utf8');
const paths = data.match(/d=\"([^\"]+)\"/g).map(p => p.slice(3, -1));
let box = [Infinity, Infinity, -Infinity, -Infinity];
paths.forEach(p => {
    const b = svgPathBbox(p);
    box[0] = Math.min(box[0], b[0]);
    box[1] = Math.min(box[1], b[1]);
    box[2] = Math.max(box[2], b[2]);
    box[3] = Math.max(box[3], b[3]);
});
console.log('VIEWBOX: ' + box[0] + ' ' + box[1] + ' ' + (box[2]-box[0]) + ' ' + (box[3]-box[1]));
