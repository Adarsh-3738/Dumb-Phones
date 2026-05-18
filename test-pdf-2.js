import mongoose from "mongoose";
import Order from "./models/orderSchema.js";
import PDFDocument from "pdfkit";
import fs from "fs";

mongoose.connect("mongodb://localhost:27017/dumbphones", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const orders = await Order.find({ status: "Delivered" }).limit(5).populate("userId", "name").populate("orderedItems.product", "productName");
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    doc.pipe(fs.createWriteStream('test-sales.pdf'));
    const col1 = 40, col2 = 150, col3 = 210, col4 = 300, col_sub = 470, col_tax = 530, col5 = 580, col6 = 670, col7 = 740;
    let y = 100;
    orders.forEach(o => {
      const itemsStr = o.orderedItems.map(i => `${i.product?.productName || 'Unknown Item'} (x${i.quantity})`).join("\n");
      const subtotalText = (o.totalPrice === 0 || !o.totalPrice) ? "Returned" : o.totalPrice.toString();
      doc.text(itemsStr, col4, y, { width: 160, lineBreak: true });
      doc.text(subtotalText, col_sub, y, { width: 50, align: 'center' });
      y += 50;
    });
    doc.end();
    console.log("PDF written");
    mongoose.disconnect();
  });
