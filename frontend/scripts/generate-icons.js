import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');
const sourcePath = path.resolve(publicDir, 'technician.png');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

async function generateIcons() {
  if (!fs.existsSync(sourcePath)) {
    process.exit(1);
  }

  const base64Png = fs.readFileSync(sourcePath).toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <image href="data:image/png;base64,${base64Png}" x="0" y="0" width="512" height="512" />
</svg>`;

  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);
  fs.writeFileSync(path.join(publicDir, 'pwa-icon.svg'), svgContent);
  fs.writeFileSync(path.join(publicDir, 'pwa-maskable.svg'), svgContent);

  // 2. PNG and ICO outputs
  const targets = [
    { name: 'pwa-64x64.png', size: 64 },
    { name: 'pwa-192x192.png', size: 192 },
    { name: 'pwa-512x512.png', size: 512 },
    { name: 'maskable-icon-512x512.png', size: 512 },
    { name: 'apple-touch-icon-180x180.png', size: 180 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'favicon.ico', size: 48 },
  ];

  for (const target of targets) {
    const outputPath = path.join(publicDir, target.name);

    if (target.name.endsWith('.ico')) {
      await sharp(sourcePath).resize(target.size, target.size).toFormat('png').toFile(outputPath);
    } else {
      await sharp(sourcePath).resize(target.size, target.size).toFile(outputPath);
    }
  }
}

generateIcons().catch((err) => {
  process.exit(1);
});
