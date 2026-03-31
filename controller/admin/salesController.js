import Order from "../../models/orderSchema.js";
import PDFDocument from "pdfkit";
import exceljs from "exceljs";

// Date Helper Function
const getDatesByRange = (range, startDate, endDate) => {
  let start = new Date();
  let end = new Date();

  // Reset clock for accuracy
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
    end.setHours(23, 59, 59, 999);
  } else {
    start = new Date(0); // All time if unspecified 
  }
  return { start, end };
};

// Sales Report Dashboard
export const getSalesReport = async (req, res) => {
  try {
    const range = req.query.range || "monthly";
    const startDate = req.query.startDate || "";
    const endDate = req.query.endDate || "";
    const searchQuery = req.query.search || "";
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const { start, end } = getDatesByRange(range, startDate, endDate);

    // Only count completed/Delivered orders for financial accuracy
    const query = {
      status: "Delivered", 
      createdOn: { $gte: start, $lte: end }
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
    
    // Aggregate Total Stats dynamically
    const stats = await Order.aggregate([
      { $match: query },
      { $group: {
          _id: null,
          salesCount: { $sum: 1 },
          orderAmount: { $sum: "$finalAmount" },
          totalDiscount: { $sum: "$discount" } // Tracking all coupon/offer deductions
        }
      }
    ]);

    const reportStats = stats[0] || { salesCount: 0, orderAmount: 0, totalDiscount: 0 };

    res.render("admin/sales-report", {
      orders,
      stats: reportStats,
      range,
      startDate,
      endDate,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
      searchQuery
    });
  } catch (error) {
    console.error("Sales Report Error:", error);
    res.status(500).render("admin/admin-error");
  }
};


// PDF DOWNLOAD
export const downloadPdf = async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDatesByRange(range, startDate, endDate);
    const query = { status: "Delivered", createdOn: { $gte: start, $lte: end } };
    
    const orders = await Order.find(query)
      .populate("userId", "name")
      .populate("orderedItems.product", "productName");
    
    const stats = await Order.aggregate([
       { $match: query },
       { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$finalAmount" }, discount: { $sum: "$discount" } } }
    ]);
    const reportStats = stats[0] || { count: 0, amount: 0, discount: 0 };

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="DumbPhones_Official_Sales_Report.pdf"');

    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    doc.pipe(res);

    // --- CORPORATE LETTERHEAD ---
    doc.rect(0, 0, doc.page.width, 80).fill('#232f3e'); // Amazon-style dark blue header
    doc.fillColor('#ffffff')
       .fontSize(24).font("Helvetica-Bold")
       .text("DUMBPHONES", 40, 25);
       
    doc.fontSize(10).font("Helvetica")
       .text("Official Sales & Revenue Report", doc.page.width - 250, 30, { align: 'right', width: 210 });
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, doc.page.width - 250, 45, { align: 'right', width: 210 });

    // --- BUSINESS INFO & REPORT SUMMARY ---
    doc.fillColor('#000000'); // Reset text color from white header
    doc.moveDown(4);
    
    const infoY = doc.y;

    // Left side: Address
    doc.fontSize(10).font("Helvetica-Bold").text("Dumb Phones Pvt. Ltd.", 40, infoY);
    doc.font("Helvetica")
       .text("1st Floor, Tech Park, Whitefield", 40, infoY + 15)
       .text("Bangalore, Karnataka - 560066", 40, infoY + 30)
       .text("GSTIN: 29AWBPP1234F1Z5", 40, infoY + 45)
       .text("Email: support@dumbphones.com", 40, infoY + 60);

    // Right side: Report Summary
    doc.font("Helvetica-Bold").text("REPORT SUMMARY", doc.page.width - 250, infoY, { align: 'right', width: 210 });
    doc.font("Helvetica")
       .text(`Total Completed Sales: ${reportStats.count}`, doc.page.width - 250, infoY + 15, { align: 'right', width: 210 })
       .text(`Gross Revenue: Rs. ${reportStats.amount.toLocaleString()}`, doc.page.width - 250, infoY + 30, { align: 'right', width: 210 })
       .text(`Total Deflected (Offers/Coupons): Rs. ${reportStats.discount.toLocaleString()}`, doc.page.width - 250, infoY + 45, { align: 'right', width: 210 });

    // Move cursor safely below the multi-line boxes
    doc.y = infoY + 90;

    // --- TABLE HEADER ---
    const tableTop = doc.y;
    const col1 = 40;  // Order ID
    const col2 = 120; // Date
    const col3 = 160; // Customer
    const col4 = 210; // Products
    const col_sub = 300; // Subtotal
    const col_tax = 345; // Tax
    const col5 = 390; // Deductions
    const col6 = 445; // Payment
    const col7 = 495; // Final Price

    doc.rect(40, tableTop - 5, doc.page.width - 80, 25).fill('#f1f5f9');
    doc.fillColor('#0f172a').fontSize(8).font("Helvetica-Bold");
    doc.text("Order ID", col1, tableTop);
    doc.text("Date", col2, tableTop);
    doc.text("Customer", col3, tableTop);
    doc.text("Items", col4, tableTop);
    doc.text("Subtotal", col_sub, tableTop, { width: 40, align: 'center' });
    doc.text("Tax", col_tax, tableTop, { width: 35, align: 'center' });
    doc.text("Deductions", col5, tableTop, { width: 50, align: 'center' });
    doc.text("Payment", col6, tableTop);
    doc.text("Paid", col7, tableTop);

    doc.moveTo(40, tableTop + 20).lineTo(doc.page.width - 40, tableTop + 20).lineWidth(1).strokeColor('#cbd5e1').stroke(); 

    doc.font("Helvetica").fillColor('#334155');
    let y = tableTop + 30;

    orders.forEach(o => {
      // Pagination catch
      if (y > 750) { 
        doc.addPage(); 
        y = 50; 
      }
      
      const itemsStr = o.orderedItems.map(i => `${i.product?.productName || 'Unknown Item'} (x${i.quantity})`).join("\n");
      const discountText = `${o.discount}\n${o.couponApplied ? '[Coupon Applied]' : (o.discount > 0 ? '[Product Category Offers]' : '')}`;
      const paymentText = `${o.paymentMethod || 'COD'}\n[${o.paymentStatus}]`;
      
      doc.fontSize(8);
      doc.text(o.orderId.toUpperCase(), col1, y, { width: 75, lineBreak: true });
      doc.text(new Date(o.createdOn).toLocaleDateString(), col2, y, { width: 35 });
      doc.text(o.userId?.name || 'Guest', col3, y, { width: 45 });
      doc.text(itemsStr, col4, y, { width: 85, lineBreak: true });
      doc.text(o.totalPrice.toString(), col_sub, y, { width: 40, align: 'center' });
      doc.text(o.tax ? o.tax.toString() : '0', col_tax, y, { width: 35, align: 'center' });
      doc.text(discountText, col5, y, { width: 50, align: 'center' });
      doc.text(paymentText, col6, y, { width: 45 });
      doc.font("Helvetica-Bold").fillColor('#10b981').text(`Rs. ${o.finalAmount.toLocaleString()}`, col7, y, { width: 55 });
      doc.font("Helvetica").fillColor('#334155'); // Reset
      
      const textHeight = Math.max(
        doc.heightOfString(itemsStr, { width: 85, fontSize: 8 }),
        doc.heightOfString(o.orderId, { width: 75, fontSize: 8 }),
        doc.heightOfString(discountText, { width: 50, fontSize: 8 })
      );
      y += Math.max(textHeight, 30) + 10;
      
      doc.moveTo(40, y - 5).lineTo(doc.page.width - 40, y - 5).lineWidth(0.5).strokeColor("#e2e8f0").stroke();
    });

    // Footer
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

  } catch (error) { console.error(error); res.status(500).send("Error generating PDF"); }
};


// EXCEL DOWNLOAD
export const downloadExcel = async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDatesByRange(range, startDate, endDate);
    
    const orders = await Order.find({ status: "Delivered", createdOn: { $gte: start, $lte: end } })
      .populate("userId", "name")
      .populate("orderedItems.product", "productName");
    
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    // Style Excel Grid
    worksheet.mergeCells('A1:I1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = 'DUMBPHONES - OFFICIAL REVENUE REPORT';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF232F3E' } }; // Amazon Blue/Grey
    titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.getRow(1).height = 30;

    worksheet.mergeCells('A2:I2');
    worksheet.getCell('A2').value = `Generated on: ${new Date().toLocaleString()} | Contains Confirmed Orders Only`;
    worksheet.getCell('A2').font = { italic: true };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    // Setup Header Row (Row 3)
    const headerRow = worksheet.getRow(3);
    headerRow.values = [
      "Order ID", "Date", "Customer", "Line Items", "Subtotal (Rs)", "Tax (Rs)", "Coupon Applied?", "Discounts (Rs)", "Payment Method", "Amount Paid (Rs)"
    ];
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    
    // Explicit Columns (Starting mapping from Row 4 implicitly)
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
      { key: "amount", width: 20 }
    ];

    orders.forEach(o => {
      const itemsStr = o.orderedItems.map(i => `• ${i.product?.productName || 'Unknown'} (x${i.quantity})`).join("\n");
      
      worksheet.addRow({
        orderId: o.orderId.toUpperCase(),
        date: new Date(o.createdOn).toLocaleDateString(),
        customer: o.userId?.name || "Guest",
        products: itemsStr,
        regular: o.totalPrice,
        tax: o.tax || 0,
        coupon: o.couponApplied ? "Yes (Coupon Applied)" : (o.discount > 0 ? "No (Product Category Offers)" : "None"),
        discount: o.discount,
        payment: `${o.paymentMethod || 'Unknown'} (${o.paymentStatus})`,
        amount: o.finalAmount
      });
    });

    // Formatting for line breaks and center alignment
    worksheet.getColumn('products').alignment = { wrapText: true, vertical: 'middle' };
    worksheet.getColumn('regular').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getColumn('tax').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getColumn('discount').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getColumn('amount').font = { bold: true, color: { argb: 'FF10B981' } };

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="DumbPhones_Official_Sales_Report.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch(error) { console.error(error); res.status(500).send("Error Generating Excel"); }
};
