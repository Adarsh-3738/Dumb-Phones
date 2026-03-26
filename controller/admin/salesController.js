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

// GET: Sales Report Dashboard
export const getSalesReport = async (req, res) => {
  try {
    const range = req.query.range || "monthly";
    const startDate = req.query.startDate || "";
    const endDate = req.query.endDate || "";
    
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

    const orders = await Order.find(query)
      .populate("userId", "name email")
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
      totalPages: Math.ceil(totalOrders / limit)
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
    
    const orders = await Order.find(query).populate("userId", "name");
    
    const stats = await Order.aggregate([
       { $match: query },
       { $group: { _id: null, count: { $sum: 1 }, amount: { $sum: "$finalAmount" }, discount: { $sum: "$discount" } } }
    ]);
    const reportStats = stats[0] || { count: 0, amount: 0, discount: 0 };

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="DumbPhones_Sales_Report.pdf"');

    const doc = new PDFDocument({ margin: 30 });
    doc.pipe(res);

    doc.fontSize(22).text("DumbPhones - Sales Report", { align: "center" });
    doc.moveDown();
    
    doc.fontSize(12).text(`Overall Sales Count: ${reportStats.count}`);
    doc.text(`Overall Order Amount: Rs. ${reportStats.amount}`);
    doc.text(`Overall Deductions (Coupons/Offers): Rs. ${reportStats.discount}`);
    doc.moveDown();

    doc.text("Order ID   |   Date   |   Customer   |   Discount   |   Final Price");
    doc.text("----------------------------------------------------------------------");
    orders.forEach(o => {
      doc.text(`${o.orderId.substring(0,8)} | ${new Date(o.createdOn).toLocaleDateString()} | ${o.userId?.name || 'Guest'} | Rs. ${o.discount} | Rs. ${o.finalAmount}`);
    });

    doc.end();

  } catch (error) { console.error(error); res.status(500).send("Error generating PDF"); }
};


// EXCEL DOWNLOAD
export const downloadExcel = async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;
    const { start, end } = getDatesByRange(range, startDate, endDate);
    
    const orders = await Order.find({ status: "Delivered", createdOn: { $gte: start, $lte: end } }).populate("userId", "name");
    
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet("Sales Report");

    worksheet.columns = [
      { header: "Order ID", key: "orderId", width: 15 },
      { header: "Date", key: "date", width: 15 },
      { header: "Customer", key: "customer", width: 25 },
      { header: "Discount Applied (Rs)", key: "discount", width: 20 },
      { header: "Final Amount (Rs)", key: "amount", width: 20 }
    ];

    orders.forEach(o => {
      worksheet.addRow({
        orderId: o.orderId.substring(0, 8),
        date: new Date(o.createdOn).toLocaleDateString(),
        customer: o.userId?.name || "Guest",
        discount: o.discount,
        amount: o.finalAmount
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", 'attachment; filename="DumbPhones_Sales_Report.xlsx"');

    await workbook.xlsx.write(res);
    res.end();
  } catch(error) { res.status(500).send("Error Generating Excel"); }
};
