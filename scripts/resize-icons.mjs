import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, 'public', 'icons');
const sourceIcon = path.join(iconsDir, 'codemind-icon.png');

const sizes = [16, 32, 48, 128];

async function resizeIcons() {
    console.log('Resizing codemind-icon.png to all sizes...');

    for (const size of sizes) {
        const outputPath = path.join(iconsDir, `icon${size}.png`);
        await sharp(sourceIcon)
            .resize(size, size, { fit: 'contain' })
            .png()
            .toFile(outputPath);
        console.log(`Created icon${size}.png (${size}x${size})`);
    }

    console.log('Done!');
}

resizeIcons().catch(console.error);
