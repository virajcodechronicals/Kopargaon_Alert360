const fs = require('fs');
const boundaryCode = fs.readFileSync('src/KopargaonBoundary.ts', 'utf8');
// extract json string
const jsonStr = boundaryCode.substring(boundaryCode.indexOf('{'), boundaryCode.lastIndexOf('}') + 1);
const geojson = (new Function('return ' + jsonStr))();

let minX = 180, maxX = -180, minY = 90, maxY = -90;
const coords = geojson.geometry.type === 'Polygon' ? geojson.geometry.coordinates[0] : geojson.geometry.coordinates[0][0];

coords.forEach(p => {
  if (p[0] < minX) minX = p[0];
  if (p[0] > maxX) maxX = p[0];
  if (p[1] < minY) minY = p[1];
  if (p[1] > maxY) maxY = p[1];
});

console.log(`Bounds: ${minX}, ${minY} to ${maxX}, ${maxY}`);

// Generate a grid of points
const points = [];
const stepsX = 12;
const stepsY = 12;
for (let i = 0; i <= stepsX; i++) {
  for (let j = 0; j <= stepsY; j++) {
    const x = minX + (maxX - minX) * (i / stepsX);
    const y = minY + (maxY - minY) * (j / stepsY);
    // Simple point in polygon check could be done, but for now just grid.
    points.push([x, y]);
  }
}
fs.writeFileSync('src/HeatGrid.ts', 'export const HEAT_GRID = ' + JSON.stringify(points) + ';');
console.log('Saved ' + points.length + ' points to HeatGrid.ts');
