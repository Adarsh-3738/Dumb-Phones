const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const productImgPath = path.join(__dirname, "../public/uploads/products");
if (!fs.existsSync(productImgPath)) fs.mkdirSync(productImgPath, { recursive: true });

async function processProductImage(buffer, filename){
  const dest = path.join(productImgPath, filename);
  // 1) Resize & crop to square 800x800, convert to jpeg
  await sharp(buffer)
    .rotate() // use orientation from exif
    .resize(800, 800, { fit: "cover", position: "centre" })
    .jpeg({ quality: 88 })
    .toFile(dest);
  return filename;
}

module.exports = { processProductImage };
