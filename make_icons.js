/**
 * make_icons.js
 * Generates all required Tauri icon assets from stash.png using sharp.
 * Run: node make_icons.js
 * Requires: npm install --save-dev sharp
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SOURCE = path.resolve('stash.png');
const ICONS_DIR = path.resolve('icons');

if (!fs.existsSync(SOURCE)) {
  console.error('❌  stash.png not found in project root!');
  process.exit(1);
}

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

console.log('🎨  Generating Tauri icon assets from stash.png...\n');

const pngTargets = [
  { name: '32x32.png',      size: 32  },
  { name: '128x128.png',    size: 128 },
  { name: '128x128@2x.png', size: 256 },
  { name: 'icon.png',       size: 512 },
];

// Generate all PNG sizes
for (const target of pngTargets) {
  const dest = path.join(ICONS_DIR, target.name);
  await sharp(SOURCE)
    .resize(target.size, target.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(dest);
  console.log(`  ✅  ${target.name} (${target.size}x${target.size})`);
}

// Generate ICO (Windows) — embed 16, 32, 48, 256 sizes
// We build each size as a PNG buffer then stitch into ICO manually
const icoSizes = [16, 32, 48, 256];
const icoImages = [];

for (const size of icoSizes) {
  const buf = await sharp(SOURCE)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  icoImages.push({ size, buf });
}

// Build ICO file manually (ICONDIR + ICONDIRENTRY[] + image data)
const numImages = icoImages.length;
const headerSize = 6; // ICONDIR
const entrySize = 16; // ICONDIRENTRY per image
const dataOffset = headerSize + entrySize * numImages;

const totalSize = dataOffset + icoImages.reduce((sum, img) => sum + img.buf.length, 0);
const icoBuffer = Buffer.alloc(totalSize);

// ICONDIR
icoBuffer.writeUInt16LE(0, 0);       // reserved
icoBuffer.writeUInt16LE(1, 2);       // type = 1 (ICO)
icoBuffer.writeUInt16LE(numImages, 4);

let offset = dataOffset;
icoImages.forEach((img, i) => {
  const entry = headerSize + i * entrySize;
  const w = img.size >= 256 ? 0 : img.size;
  const h = img.size >= 256 ? 0 : img.size;
  icoBuffer.writeUInt8(w, entry);           // width  (0 = 256)
  icoBuffer.writeUInt8(h, entry + 1);       // height (0 = 256)
  icoBuffer.writeUInt8(0, entry + 2);       // color count
  icoBuffer.writeUInt8(0, entry + 3);       // reserved
  icoBuffer.writeUInt16LE(1, entry + 4);    // color planes
  icoBuffer.writeUInt16LE(32, entry + 6);   // bits per pixel
  icoBuffer.writeUInt32LE(img.buf.length, entry + 8);  // size of image data
  icoBuffer.writeUInt32LE(offset, entry + 12);          // offset to image data
  img.buf.copy(icoBuffer, offset);
  offset += img.buf.length;
});

const icoPath = path.join(ICONS_DIR, 'icon.ico');
fs.writeFileSync(icoPath, icoBuffer);
console.log(`  ✅  icon.ico (16/32/48/256px)`);

// Generate ICNS (macOS) — use iconutil if on macOS, otherwise write a placeholder
// On Windows/Linux we write a minimal placeholder (Tauri only needs .icns on macOS builds)
const icnsPath = path.join(ICONS_DIR, 'icon.icns');
try {
  const icnsTmpDir = path.join(ICONS_DIR, 'icon.iconset');
  if (!fs.existsSync(icnsTmpDir)) fs.mkdirSync(icnsTmpDir);

  const icnsSizes = [
    { name: 'icon_16x16.png',      size: 16  },
    { name: 'icon_16x16@2x.png',   size: 32  },
    { name: 'icon_32x32.png',      size: 32  },
    { name: 'icon_32x32@2x.png',   size: 64  },
    { name: 'icon_128x128.png',    size: 128 },
    { name: 'icon_128x128@2x.png', size: 256 },
    { name: 'icon_256x256.png',    size: 256 },
    { name: 'icon_256x256@2x.png', size: 512 },
    { name: 'icon_512x512.png',    size: 512 },
    { name: 'icon_512x512@2x.png', size: 1024},
  ];

  for (const s of icnsSizes) {
    await sharp(SOURCE)
      .resize(s.size, s.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(icnsTmpDir, s.name));
  }

  // Try iconutil (macOS only)
  try {
    execSync(`iconutil -c icns "${icnsTmpDir}" -o "${icnsPath}"`, { stdio: 'ignore' });
    console.log(`  ✅  icon.icns (macOS iconutil)`);
  } catch {
    // Not on macOS — write minimal ICNS placeholder (valid enough for Tauri Windows build)
    const minIcns = Buffer.from('69636e730000000c00000000', 'hex');
    fs.writeFileSync(icnsPath, minIcns);
    console.log(`  ⚠️   icon.icns — placeholder written (macOS-only format, not needed for Windows builds)`);
  }

  // Clean up iconset temp dir
  fs.rmSync(icnsTmpDir, { recursive: true, force: true });
} catch (err) {
  console.log(`  ⚠️   icon.icns — skipped (${err.message})`);
}

console.log('\n🚀  All icons generated successfully in icons/');
console.log('    Source: stash.png\n');
