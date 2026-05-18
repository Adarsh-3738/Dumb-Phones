import PDFDocument from "pdfkit";
import fs from "fs";

const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
doc.pipe(fs.createWriteStream('test-pdf-4.pdf'));

doc.font("Helvetica").fontSize(8);
const text = "Returned";
const width = doc.widthOfString(text);
console.log("Width of 'Returned' at 8pt Helvetica:", width);
doc.end();
