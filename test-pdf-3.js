import PDFDocument from "pdfkit";
import fs from "fs";

const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
doc.pipe(fs.createWriteStream('test-pdf-3.pdf'));

const col_sub = 470;
const col7 = 740;

const o = { totalPrice: 0, finalAmount: 0 };
const subtotalText = (o.totalPrice === 0 || !o.totalPrice) ? "Returned" : o.totalPrice.toString();
doc.text(subtotalText, col_sub, 100, { width: 50, align: 'center' });

const amountPaidText = (o.finalAmount === 0 || !o.finalAmount) ? "Returned" : `Rs. ${o.finalAmount}`;
doc.font("Helvetica-Bold").fillColor(o.finalAmount === 0 ? '#ef4444' : '#10b981').text(amountPaidText, col7, 100, { width: 60 });

doc.end();
console.log("PDF generated.");
