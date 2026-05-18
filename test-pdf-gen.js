import mongoose from "mongoose";
import Order from "./models/orderSchema.js";
import PDFDocument from "pdfkit";
import fs from "fs";

mongoose.connect("mongodb://localhost:27017/dumbphones", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    // We will query the EXACT same way downloadPdf does
    const query = { status: "Delivered" };
    const orders = await Order.find(query)
      .populate("userId", "name")
      .populate("orderedItems.product", "productName");
      
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    doc.pipe(fs.createWriteStream('test-actual-sales.pdf'));
    
    // ... basic headers ...
    const tableTop = 150;
    const col1 = 40;   // Order ID 
    const col2 = 150;  // Date
    const col3 = 210;  // Customer
    const col4 = 300;  // Products
    const col_sub = 470; // Subtotal
    const col_tax = 530; // Tax
    const col5 = 580;  // Deductions
    const col6 = 670;  // Payment
    const col7 = 740;  // Final Price
    let y = tableTop;
    
    orders.forEach(o => {
      const itemsStr = o.orderedItems.map(i => `${i.product?.productName || 'Unknown Item'} (x${i.quantity})`).join("\n");
      const discountText = `${o.discount}\n${o.couponApplied ? '[Coupon Applied]' : (o.discount > 0 ? '[Product Category Offers]' : '')}`;
      const paymentText = `${o.paymentMethod || 'COD'}\n[${o.paymentStatus}]`;
      
      const subtotalText = (o.totalPrice === 0 || !o.totalPrice) ? "Returned" : o.totalPrice.toString();
      const amountPaidText = (o.finalAmount === 0 || !o.finalAmount) ? "Returned" : `Rs. ${o.finalAmount}`;
      
      doc.text(itemsStr, col4, y, { width: 160, lineBreak: true });
      doc.text(subtotalText, col_sub, y, { width: 50, align: 'center' });
      doc.text(amountPaidText, col7, y, { width: 60 });
      y += 50;
    });
    
    doc.end();
    console.log("PDF written");
    mongoose.disconnect();
  });
