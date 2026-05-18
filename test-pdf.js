import PDFDocument from "pdfkit";
import fs from "fs";

const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
doc.pipe(fs.createWriteStream('test.pdf'));
const col_sub = 470;
let y = 100;
doc.font("Helvetica").fillColor('#334155').fontSize(8);
doc.text("Returned", col_sub, y, { width: 50, align: 'center' });
doc.end();
console.log("PDF generated");
