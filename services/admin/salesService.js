import Order from "../../models/orderSchema.js";
import PDFDocument from "pdfkit";
import exceljs from "exceljs";

export const getDatesByRange = (range, startDate, endDate) => {
  let start = new Date();
  let end = new Date();

  if (range === "daily") {
    start.setHours(0, 0, 0, 0);
  } else if (range === "weekly") {
    start.setDate(start.getDate() - 7);
  } else if (range === "monthly") {
    start.setMonth(start.getMonth() - 1);
  } else if (range === "yearly") {
    start.setFullYear(start.getFullYear() - 1);
  } else if (range === "custom" && startDate && endDate) {
    start = new Date(startDate);
    end = new Date(endDate);
    if (start > end) {
      const temp = start;
      start = end;
      end = temp;
    }
    end.setHours(23, 59, 59, 999);
  } else {
    start = new Date(0);
  }
  return { start, end };
};

export const fetchSalesReportData = async ({ range, startDate, endDate, searchQuery, page = 1, limit = 10 }) => {
  const skip = (page - 1) * limit;
  const { start, end } = getDatesByRange(range, startDate, endDate);

  const query = {
    createdOn: { $gte: start, $lte: end },
    $or: [
      { status: { $in: ["Delivered", "Returned"] } },
      { paymentMethod: { $ne: "COD" }, paymentStatus: "Paid" }
    ]
  };

  if (searchQuery) {
    query.orderId = { $regex: searchQuery, $options: "i" };
  }

  const orders = await Order.find(query)
    .populate("userId", "name email")
    .populate("orderedItems.product", "productName")
    .populate("orderedItems.variant", "regularPrice salesPrice color")
    .sort({ createdOn: -1 })
    .skip(skip)
    .limit(limit);

  const totalOrders = await Order.countDocuments(query);

  const stats = await Order.aggregate([
    { $match: query },
    { $group: {
        _id: null,
        totalOrdersCount: { $sum: 1 },
        deliveredCount: { $sum: { $cond: [{ $ne: ["$status", "Returned"] }, 1, 0] } },
        returnedCount: { $sum: { $cond: [{ $eq: ["$status", "Returned"] }, 1, 0] } },
        netRevenue: { $sum: { $cond: [{ $ne: ["$status", "Returned"] }, "$finalAmount", 0] } },
        totalRefunded: { $sum: { $ifNull: ["$refundedAmount", 0] } },
        totalDiscount: { $sum: { $cond: [{ $ne: ["$status", "Returned"] }, "$discount", 0] } }
      }
    }
  ]);

  const reportStats = stats[0] || { totalOrdersCount: 0, deliveredCount: 0, returnedCount: 0, netRevenue: 0, totalRefunded: 0, totalDiscount: 0 };

  return {
    orders,
    reportStats,
    totalPages: Math.ceil(totalOrders / limit),
    currentPage: page
  };
};

export const generateSalesPdfStream = async (res, { range, startDate, endDate }) => {
  const { start, end } = getDatesByRange(range, startDate, endDate);
  const query = {
    createdOn: { $gte: start, $lte: end },
    $or: [
      { status: { $in: ["Delivered", "Returned"] } },
      { paymentMethod: { $ne: "COD" }, paymentStatus: "Paid" }
    ]
  };
  
  const orders = await Order.find(query)
    .populate("userId", "name")
    .populate("orderedItems.product", "productName")
    .sort({ createdOn: -1 });
  
  const stats = await Order.aggregate([
    { $match: query },
    { $group: {
        _id: null,
        totalOrdersCount: { $sum: 1 },
        deliveredCount: { $sum: { $cond: [{ $ne: ["$status", "Returned"] }, 1, 0] } },
        returnedCount: { $sum: { $cond: [{ $eq: ["$status", "Returned"] }, 1, 0] } },
        netRevenue: { $sum: { $cond: [{ $ne: ["$status", "Returned"] }, "$finalAmount", 0] } },
        totalRefunded: { $sum: { $ifNull: ["$refundedAmount", 0] } },
        totalDiscount: { $sum: { $cond: [{ $ne: ["$status", "Returned"] }, "$discount", 0] } }
      }
    }
  ]);
  const reportStats = stats[0] || { totalOrdersCount: 0, deliveredCount: 0, returnedCount: 0, netRevenue: 0, totalRefunded: 0, totalDiscount: 0 };

  const doc = new PDFDocument({
    margin: 40,
    size: "A4",
    layout: "landscape",
    bufferPages: true
  });
  doc.pipe(res);

  // CORPORATE LETTERHEAD
  doc.rect(0, 0, doc.page.width, 80).fill('#232f3e');
  doc.fillColor('#ffffff')
     .fontSize(24).font("Helvetica-Bold")
     .text("DUMBPHONES", 40, 25);
     
  doc.fontSize(10).font("Helvetica")
     .text("Official Sales & Revenue Report", doc.page.width - 250, 30, { align: 'right', width: 210 });
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, doc.page.width - 250, 45, { align: 'right', width: 210 });
  doc.text(`Period: ${start.toLocaleDateString()} to ${end.toLocaleDateString()}`, doc.page.width - 250, 60, { align: 'right', width: 210 });

  // BUSINESS INFO & REPORT SUMMARY
  doc.fillColor('#000000');
  doc.moveDown(4);
  
  const infoY = doc.y;

  doc.fontSize(10).font("Helvetica-Bold").text("Dumb Phones Pvt. Ltd.", 40, infoY);
  doc.font("Helvetica")
     .text("1st Floor, Tech Park, Whitefield", 40, infoY + 15)
     .text("Bangalore, Karnataka - 560066", 40, infoY + 30)
     .text("GSTIN: 29AWBPP1234F1Z5", 40, infoY + 45)
     .text("Email: support@dumbphones.com", 40, infoY + 60);

  doc.font("Helvetica-Bold").text("REPORT SUMMARY", doc.page.width - 250, infoY, { align: 'right', width: 210 });
  doc.font("Helvetica")
     .text(`Total Orders: ${reportStats.totalOrdersCount} (${reportStats.deliveredCount} Del, ${reportStats.returnedCount} Ret)`, doc.page.width - 250, infoY + 15, { align: 'right', width: 210 })
     .text(`Net Revenue: Rs. ${reportStats.netRevenue.toLocaleString()}`, doc.page.width - 250, infoY + 30, { align: 'right', width: 210 })
     .text(`Total Discounts: Rs. ${reportStats.totalDiscount.toLocaleString()}`, doc.page.width - 250, infoY + 45, { align: 'right', width: 210 })
     .text(`Total Refunds: Rs. ${reportStats.totalRefunded.toLocaleString()}`, doc.page.width - 250, infoY + 60, { align: 'right', width: 210 });

  doc.y = infoY + 90;

  // TABLE HEADER
  const tableTop = doc.y;
  const col1 = 40;
  const col2 = 135;
  const col3 = 190;
  const col4 = 265;
  const col_sub = 415;
  const col_tax = 470;
  const col5 = 515;
  const col6 = 590;
  const col_status = 665;
  const col7 = 735;

  doc.rect(40, tableTop - 5, doc.page.width - 80, 25).fill('#f1f5f9');
  doc.fillColor('#0f172a').fontSize(8).font("Helvetica-Bold");
  doc.text("Order ID", col1, tableTop);
  doc.text("Date", col2, tableTop);
  doc.text("Customer", col3, tableTop);
  doc.text("Items", col4, tableTop);
  doc.text("Subtotal", col_sub, tableTop, { width: 50, align: 'center' });
  doc.text("Tax", col_tax, tableTop, { width: 40, align: 'center' });
  doc.text("Deductions", col5, tableTop, { width: 75, align: 'center' });
  doc.text("Payment", col6, tableTop);
  doc.text("Status", col_status, tableTop);
  doc.text("Paid", col7, tableTop);

  doc.moveTo(40, tableTop + 20).lineTo(doc.page.width - 40, tableTop + 20).lineWidth(1).strokeColor('#cbd5e1').stroke(); 

  doc.font("Helvetica").fillColor('#334155');
  let y = tableTop + 30;

  orders.forEach(o => {
    if (y > 750) { 
      doc.addPage(); 
      y = 50; 
    }
    
    const itemsStr = o.orderedItems.map(i => {
      let text = `${i.product?.productName || 'Unknown Item'} (x${i.quantity})`;
      if (i.itemStatus === 'Returned' || i.itemStatus === 'Cancelled') {
        text += ` [${i.itemStatus}]`;
      }
      return text;
    }).join("\n");
    const discountText = `${o.discount}\n${o.couponApplied ? '[Coupon Applied]' : (o.discount > 0 ? '[Product Category Offers]' : '')}`;
    const paymentText = `${o.paymentMethod || 'COD'}`;
    
    doc.fontSize(8);
    doc.text(o.orderId.toUpperCase(), col1, y, { width: 90, lineBreak: true });
    doc.text(new Date(o.createdOn).toLocaleDateString(), col2, y, { width: 50 });
    doc.text(o.userId?.name || 'Guest', col3, y, { width: 70, lineBreak: true });
    doc.text(itemsStr, col4, y, { width: 140, lineBreak: true });
    
    const subtotalText = (o.totalPrice === 0 || !o.totalPrice) ? "Returned" : o.totalPrice.toString();
    if (subtotalText === "Returned") {
      doc.text(subtotalText, col_sub, y, { align: 'center' });
    } else {
      doc.text(subtotalText, col_sub, y, { width: 50, align: 'center' });
    }
    
    doc.text(o.tax ? o.tax.toString() : '0', col_tax, y, { width: 40, align: 'center' });
    doc.text(discountText, col5, y, { width: 75, align: 'center', lineBreak: true });
    doc.text(paymentText, col6, y, { width: 70, lineBreak: true });
    doc.text(o.status.toUpperCase(), col_status, y, { width: 65, lineBreak: true });
    
    let amountPaidText = `Rs. ${o.finalAmount.toLocaleString()}`;
    if (o.status === "Returned" || (o.refundedAmount && o.refundedAmount > 0)) {
      if (o.status === "Returned") {
        amountPaidText = `Returned\n(Rs. ${(o.refundedAmount || 0).toLocaleString()} ref)`;
      } else {
        amountPaidText = `Rs. ${o.finalAmount.toLocaleString()}\n(Rs. ${o.refundedAmount.toLocaleString()} ref)`;
      }
    }
    doc.font("Helvetica-Bold").fillColor(o.status === "Returned" ? '#ef4444' : '#10b981').text(amountPaidText, col7, y, { width: 65 });
    doc.font("Helvetica").fillColor('#334155');
    
    const textHeight = Math.max(
      doc.heightOfString(itemsStr, { width: 160, fontSize: 8 }),
      doc.heightOfString(o.orderId, { width: 100, fontSize: 8 }),
      doc.heightOfString(discountText, { width: 75, fontSize: 8 })
    );
    y += Math.max(textHeight, 25) + 10;
    
    doc.moveTo(40, y - 5).lineTo(doc.page.width - 40, y - 5).lineWidth(0.5).strokeColor("#e2e8f0").stroke();
  });

  const pages = doc.bufferedPageRange ? doc.bufferedPageRange().count : 1;
  for (let i = 0; i < pages; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).fillColor('#94a3b8').text(
          `CONFIDENTIAL - DumbPhones Internal Use Only | Generated ${new Date().toLocaleString()}`, 
          40, 
          doc.page.height - 30, 
          { align: 'center', width: doc.page.width - 80 }
      );
  }

  doc.end();
};

export const generateSalesExcelStream = async (res, { range, startDate, endDate }) => {
  const { start, end } = getDatesByRange(range, startDate, endDate);
  
  const query = {
    createdOn: { $gte: start, $lte: end },
    $or: [
      { status: { $in: ["Delivered", "Returned"] } },
      { paymentMethod: { $ne: "COD" }, paymentStatus: "Paid" }
    ]
  };
  
  const orders = await Order.find(query)
    .populate("userId", "name")
    .populate("orderedItems.product", "productName")
    .sort({ createdOn: -1 });
  
  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet("Sales Report");

  worksheet.mergeCells('A1:J1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'DUMBPHONES - OFFICIAL REVENUE REPORT';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF232F3E' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.getRow(1).height = 30;

  worksheet.mergeCells('A2:J2');
  worksheet.getCell('A2').value = `Period: ${start.toLocaleDateString()} to ${end.toLocaleDateString()} | Generated on: ${new Date().toLocaleString()}`;
  worksheet.getCell('A2').font = { italic: true };
  worksheet.getCell('A2').alignment = { horizontal: 'center' };

  const headerRow = worksheet.getRow(3);
  headerRow.values = [
    "Order ID", "Date", "Customer", "Line Items", "Subtotal (Rs)", "Tax (Rs)", "Coupon Applied?", "Discounts (Rs)", "Payment Method", "Order Status", "Amount Paid (Rs)"
  ];
  headerRow.font = { bold: true };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  
  worksheet.columns = [
    { key: "orderId", width: 40 },
    { key: "date", width: 15 },
    { key: "customer", width: 25 },
    { key: "products", width: 55 },
    { key: "regular", width: 15 },
    { key: "tax", width: 12 },
    { key: "coupon", width: 20 },
    { key: "discount", width: 15 },
    { key: "payment", width: 20 },
    { key: "status", width: 15 },
    { key: "amount", width: 20 }
  ];

  orders.forEach(o => {
    const itemsStr = o.orderedItems.map(i => {
      let text = `• ${i.product?.productName || 'Unknown'} (x${i.quantity})`;
      if (i.itemStatus === 'Returned' || i.itemStatus === 'Cancelled') {
        text += ` [${i.itemStatus}]`;
      }
      return text;
    }).join("\n");
    
    worksheet.addRow({
      orderId: o.orderId.toUpperCase(),
      date: new Date(o.createdOn).toLocaleDateString(),
      customer: o.userId?.name || "Guest",
      products: itemsStr,
      regular: (o.totalPrice === 0 || !o.totalPrice) ? "Returned" : o.totalPrice,
      tax: o.tax || 0,
      coupon: o.couponApplied ? "Yes (Coupon Applied)" : (o.discount > 0 ? "No (Product Category Offers)" : "None"),
      discount: o.discount,
      payment: `${o.paymentMethod || 'Unknown'} `,
      status: o.status,
      amount: o.status === "Returned" ? `Returned (Rs. ${o.refundedAmount || 0} refunded)` : (o.refundedAmount > 0 ? `${o.finalAmount} (Rs. ${o.refundedAmount} refunded)` : o.finalAmount)
    });
  });

  worksheet.getColumn('products').alignment = { wrapText: true, vertical: 'middle' };
  worksheet.getColumn('regular').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getColumn('tax').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getColumn('discount').alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getColumn('amount').font = { bold: true, color: { argb: 'FF10B981' } };

  await workbook.xlsx.write(res);
  res.end();
};
