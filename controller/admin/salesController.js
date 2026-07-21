import * as salesService from "../../services/admin/salesService.js";
import STATUS_CODES from "../../utils/statusCodes.js";

// Sales Report Dashboard
export const getSalesReport = async (req, res) => {
  try {
    const range = req.query.range || "monthly";
    const startDate = req.query.startDate || "";
    const endDate = req.query.endDate || "";
    const searchQuery = req.query.search || "";
    const page = parseInt(req.query.page) || 1;

    const { orders, reportStats, totalPages, currentPage } = await salesService.fetchSalesReportData({
      range,
      startDate,
      endDate,
      searchQuery,
      page,
      limit: 10
    });

    res.render("admin/sales-report", {
      orders,
      stats: reportStats,
      range,
      startDate,
      endDate,
      currentPage,
      totalPages,
      searchQuery
    });
  } catch (error) {
    console.error("Sales Report Error:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).render("admin/admin-error");
  }
};

// PDF DOWNLOAD
export const downloadPdf = async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Content-Disposition", `attachment; filename="DumbPhones_Sales_Report_${Date.now()}.pdf"`);

    await salesService.generateSalesPdfStream(res, { range, startDate, endDate });
  } catch (error) {
    console.error("PDF Download Error:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Error generating PDF");
  }
};

// EXCEL DOWNLOAD
export const downloadExcel = async (req, res) => {
  try {
    const { range, startDate, endDate } = req.query;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("Content-Disposition", `attachment; filename="DumbPhones_Sales_Report_${Date.now()}.xlsx"`);

    await salesService.generateSalesExcelStream(res, { range, startDate, endDate });
  } catch (error) {
    console.error("Excel Download Error:", error);
    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).send("Error Generating Excel");
  }
};
