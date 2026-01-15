import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure product uploads directory exists
const productImgPath = path.join(__dirname, "../public/uploads/products");
if (!fs.existsSync(productImgPath)) {
  fs.mkdirSync(productImgPath, { recursive: true });
}

// Function to process product image
export async function processProductImage(buffer, filename) {
  const dest = path.join(productImgPath, filename);

  // Resize & crop to square 800x800, convert to jpeg
  await sharp(buffer)
    .rotate() // use orientation from exif
    .resize(800, 800, { fit: "cover", position: "centre" })
    .jpeg({ quality: 88 })
    .toFile(dest);

  return filename;
}
