import PDFDocument from "pdfkit";

import {
  getUserOrders,
  getUserOrderDetails,
  cancelUserOrder,
  cancelUserOrderItem,
  returnUserOrder,
  returnUserOrderItem,
  searchUserOrders,
  getOrderForInvoice
} from "../../services/user/orderService.js";
import Settings from "../../models/settingsSchema.js";
import STATUS_CODES from "../../utils/statusCodes.js";
 //  LOAD ORDERS

export const loadOrders = async (req, res) => {
  try {

    const orders = await getUserOrders(req.user._id);

    res.render("user/orders", {
      user: req.user,
      orders
    });

  } catch (error) {
    console.error("Load orders error:", error);
    res.redirect("/");
  }
};



  // LOAD ORDER DETAILS

export const loadOrderDetails = async (req, res) => {
  try {

    const order = await getUserOrderDetails(
      req.params.orderId,
      req.user._id
    );

    if (!order) {
      return res.redirect("/orders");
    }

    res.render("user/order-details", {
      user: req.user,
      order
    });

  } catch (error) {
    console.error("Order details error:", error);
    res.redirect("/orders");
  }
};



 //  CANCEL ORDER

export const cancelOrder = async (req, res) => {
  try {

    const { orderId } = req.params;
    const { reason } = req.body;

    await cancelUserOrder(orderId, req.user._id, reason);

    res.json({ success: true });

  } catch (error) {

    res.status(STATUS_CODES.BAD_REQUEST).json({
      message: error.message
    });

  }
};

// CANCEL SINGLE ITEM
export const cancelOrderItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { reason } = req.body;

    const result = await cancelUserOrderItem(orderId, req.user._id, itemId, reason);

    if (result && result.couponRevoked) {
      res.json({ 
        success: true, 
        message: "Item cancelled successfully. Your coupon was revoked because the remaining order subtotal fell below the minimum purchase limit." 
      });
    } else {
      res.json({ success: true, message: "Item cancelled successfully." });
    }
  } catch (error) {
    res.status(STATUS_CODES.BAD_REQUEST).json({ message: error.message });
  }
};



  // RETURN ORDER

export const returnOrder = async (req, res) => {
  try {

    const { orderId } = req.params;
    const { reason } = req.body;

    await returnUserOrder(orderId, req.user._id, reason);

    res.json({ success: true, message: "Return requested successfully" });

  } catch (error) {

    res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: error.message });

  }
};

// RETURN SINGLE ITEM
export const returnOrderItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { reason } = req.body;

    await returnUserOrderItem(orderId, req.user._id, itemId, reason);

    res.json({ success: true, message: "Item return requested successfully" });
  } catch (error) {
    res.status(STATUS_CODES.BAD_REQUEST).json({ success: false, message: error.message });
  }
};


//order invoice 
export const downloadInvoice = async (req, res) => {
  try {
    const order = await getOrderForInvoice(req.params.orderId, req.user._id);

    const validStatuses = ['Delivered', 'Return Request', 'Returned', 'Return Rejected'];
    if (!order || !validStatuses.includes(order.status)) return res.redirect("/orders");

    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=invoice-${order.orderId}.pdf`);

    doc.pipe(res);

    // Fetch Settings
    const settings = await Settings.findOne();
    const taxRate = settings ? settings.taxRate / 100 : 0.05;
    const taxRateLabel = settings ? settings.taxRate : 5;

    // Helper functions
    const generateHr = (y) => {
      doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
    };

    const formatCurrency = (amount) => {
      return "Rs. " + amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // --- HEADER ---
    doc.fillColor("#000000").fontSize(26).font("Helvetica-Bold").text("Dumb Phones.", 50, 45);
    
    doc.fillColor("#444444").fontSize(10).font("Helvetica")
       .text("Dumb Phones Pvt. Ltd.", 50, 80)
       .text("1st Floor, Tech Park, Whitefield", 50, 95)
       .text("Bangalore, Karnataka - 560066", 50, 110)
       .text("GSTIN: 29AWBPP1234F1Z5", 50, 125);

    // INVOICE DETAILS //RIGHT 
    doc.fillColor("#000000").fontSize(20).font("Helvetica-Bold").text("TAX INVOICE", 400, 45, { align: "right" });
    
    // Increased spacing and width to handle long UUID order numbers without wrapping text
    doc.fillColor("#444444").fontSize(10).font("Helvetica-Bold")
       .text("Invoice Number:", 200, 80, { width: 120, align: "right" })
       .font("Helvetica").text(order.orderId, 330, 80, { width: 215, align: "right" })
       
       .font("Helvetica-Bold").text("Invoice Date:", 200, 100, { width: 120, align: "right" })
       .font("Helvetica").text((order.invoiceDate || order.createdOn).toLocaleDateString("en-IN"), 330, 100, { width: 215, align: "right" })
       
       .font("Helvetica-Bold").text("Order Number:", 200, 120, { width: 120, align: "right" })
       .font("Helvetica").text(order.orderId, 330, 120, { width: 215, align: "right" })

       .font("Helvetica-Bold").text("Order Date:", 200, 140, { width: 120, align: "right" })
       .font("Helvetica").text(order.createdOn.toLocaleDateString("en-IN"), 330, 140, { width: 215, align: "right" })

       .font("Helvetica-Bold").text("Payment Method:", 200, 160, { width: 120, align: "right" })
       .font("Helvetica").text(`${order.paymentMethod || 'COD'} [${order.paymentStatus}]`, 330, 160, { width: 215, align: "right" });

    generateHr(185);

    //  BILLING & SHIPPING DETAILS
    const customerTop = 200;
    
    doc.fillColor("#000000").fontSize(12).font("Helvetica-Bold").text("Billing Address", 50, customerTop);
    doc.fillColor("#444444").fontSize(10).font("Helvetica-Bold")
       .text(order.userId.name, 50, customerTop + 20)
       .font("Helvetica")
       .text(order.userId.email, 50, customerTop + 35)
       .text(order.userId.phone || "", 50, customerTop + 50);

    doc.fillColor("#000000").fontSize(12).font("Helvetica-Bold").text("Shipping Address", 300, customerTop);
    doc.fillColor("#444444").fontSize(10).font("Helvetica-Bold")
       .text(`${order.address?.name || (order.address?.firstName + " " + order.address?.lastName)}`, 300, customerTop + 20)
       .font("Helvetica")
       .text(`${order.address?.addressType || 'Home'} - ${order.address?.streetAddress || order.address?.landmark || ''}`, 300, customerTop + 35)
       .text(`${order.address?.city}, ${order.address?.state} - ${order.address?.pincode || order.address?.zipCode}`, 300, customerTop + 50)
       .text(`Phone: ${order.address?.phone}`, 300, customerTop + 65);

    generateHr(290);

    // TABLE HEADERS
    const tableTop = 315;
    doc.fillColor("#f3f4f6").rect(50, tableTop - 5, 500, 25).fill();
    doc.fillColor("#000000").fontSize(10).font("Helvetica-Bold");

    doc.text("Sl", 55, tableTop);
    doc.text("Description", 80, tableTop);
    doc.text("Unit Price", 290, tableTop, { width: 60, align: "right" });
    doc.text("Qty", 360, tableTop, { width: 30, align: "right" });
    doc.text("Disc.", 400, tableTop, { width: 50, align: "right" });
    doc.text("Net Amount", 460, tableTop, { width: 80, align: "right" });

    generateHr(tableTop + 20);

    let tableY = tableTop + 30;
    let activeSubtotal = 0;
    let totalDiscount = 0;
    
    //  TABLE ROWS 
    doc.font("Helvetica");
    let slNo = 1;

    order.orderedItems.forEach((item) => {
      let isCancelled = item.itemStatus === "Cancelled";
      let isReturned = item.itemStatus === "Returned";
      
      const regularPrice = (item.regularPrice !== undefined && item.regularPrice !== null) ? item.regularPrice : item.price;
      const unitPrice = regularPrice;
      const itemDiscount = (regularPrice - item.price) * item.quantity;
      
      if (!isCancelled) {
        activeSubtotal += (unitPrice * item.quantity);
        totalDiscount += itemDiscount;
      }

      doc.fillColor(isCancelled ? "#9ca3af" : "#000000").fontSize(10);
      
      const productName = item.product?.productName || "Unknown Product";
      const color = item.variant?.color ? ` (${item.variant.color})` : "";
      const description = `${productName}${color}`;
      
      const descHeight = doc.heightOfString(description, { width: 200 });
      
      doc.text(slNo.toString(), 55, tableY);
      doc.text(description, 80, tableY, { width: 200 });
      
      doc.text(formatCurrency(unitPrice), 290, tableY, { width: 60, align: "right" });
      doc.text(item.quantity.toString(), 360, tableY, { width: 30, align: "right" });
      
      doc.text(formatCurrency(itemDiscount), 400, tableY, { width: 50, align: "right" });
      
      if(isReturned) {
        doc.fillColor("#ef4444").text("Returned", 460, tableY, { width: 80, align: "right" });
      } else if(isCancelled) {
        doc.fillColor("#ef4444").text("Cancelled", 460, tableY, { width: 80, align: "right" });
      } else {
        const rowAmount = (unitPrice * item.quantity) - itemDiscount;
        doc.text(formatCurrency(rowAmount), 460, tableY, { width: 80, align: "right" });
      }

      tableY += Math.max(descHeight, 20) + 10;
      slNo++;
      
      // Page break check for table rows
      if (tableY > 600) {
        generateHr(tableY);
        doc.addPage();
        tableY = 50;
      }
    });

    generateHr(tableY);

    // TOTALS CALCULATION 
    const isActive = order.orderedItems.some(i => i.itemStatus !== "Cancelled" && i.itemStatus !== "Returned");
    
    const grossAmount = isActive ? (order.totalPrice !== undefined ? order.totalPrice : activeSubtotal) : 0;
    const tax = isActive ? (order.tax !== undefined ? order.tax : 0) : 0;
    const shipping = isActive ? (order.shipping !== undefined ? order.shipping : 0) : 0;
    const totalDiscountInDb = isActive ? (order.discount !== undefined ? order.discount : totalDiscount) : 0;
    const finalAmt = isActive ? (order.finalAmount !== undefined ? order.finalAmount : (grossAmount + tax + shipping - totalDiscountInDb)) : 0;

    // Separate Offer Discount and Coupon Discount for display
    let activeProductSavings = 0;
    if (isActive) {
      order.orderedItems.forEach(item => {
        if (item.itemStatus !== "Cancelled" && item.itemStatus !== "Returned") {
          const regularPrice = (item.regularPrice !== undefined && item.regularPrice !== null) ? item.regularPrice : item.price;
          activeProductSavings += (regularPrice - item.price) * item.quantity;
        }
      });
    }

    const offerDiscount = Math.min(totalDiscountInDb, activeProductSavings);
    const couponDiscount = Math.max(0, totalDiscountInDb - offerDiscount);

    // TOTALS DISPLAY 
    const totalsY = tableY + 15;
    const totalsStartX = 340;
    const totalsValueX = 460;

    doc.fillColor("#000000").fontSize(10).font("Helvetica");
    
    doc.text("Gross Amount:", totalsStartX, totalsY, { width: 100, align: "right" });
    doc.text(formatCurrency(grossAmount), totalsValueX, totalsY, { width: 80, align: "right" });
    
    doc.text(`Tax (${taxRateLabel}%):`, totalsStartX, totalsY + 20, { width: 100, align: "right" });
    doc.text(formatCurrency(tax), totalsValueX, totalsY + 20, { width: 80, align: "right" });
    
    doc.text("Shipping Charge:", totalsStartX, totalsY + 40, { width: 100, align: "right" });
    doc.text(shipping === 0 ? "Free" : formatCurrency(shipping), totalsValueX, totalsY + 40, { width: 80, align: "right" });

    let finalLineY = totalsY + 60;

    if (offerDiscount > 0) {
      doc.fillColor("#16a34a");
      doc.text("Offer Discount:", totalsStartX, finalLineY, { width: 100, align: "right" });
      doc.text(`- ${formatCurrency(offerDiscount)}`, totalsValueX, finalLineY, { width: 80, align: "right" });
      finalLineY += 20;
    }

    if (couponDiscount > 0) {
      doc.fillColor("#16a34a");
      doc.text("Coupon Discount:", totalsStartX, finalLineY, { width: 100, align: "right" });
      doc.text(`- ${formatCurrency(couponDiscount)}`, totalsValueX, finalLineY, { width: 80, align: "right" });
      finalLineY += 20;
    }

    // Final Divider
    doc.strokeColor("#000000").lineWidth(1).moveTo(340, finalLineY).lineTo(540, finalLineY).stroke();

    // Grand Total
    doc.fillColor("#000000").fontSize(12).font("Helvetica-Bold");
    doc.text("Total Payable:", totalsStartX, finalLineY + 10, { width: 100, align: "right" });
    doc.text(formatCurrency(finalAmt), totalsValueX, finalLineY + 10, { width: 80, align: "right" });

    // Amount in words
    const numToWords = (num) => {
       if (num === 0) return "Zero";
       const a = ['','One ','Two ','Three ','Four ', 'Five ','Six ','Seven ','Eight ','Nine ','Ten ','Eleven ','Twelve ','Thirteen ','Fourteen ','Fifteen ','Sixteen ','Seventeen ','Eighteen ','Nineteen '];
       const b = ['', '', 'Twenty','Thirty','Forty','Fifty', 'Sixty','Seventy','Eighty','Ninety'];
       if ((num = num.toString()).length > 9) return 'overflow';
       let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
       if (!n) return; let str = '';
       str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
       str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
       str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
       str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
       str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
       return str.trim() + " Only";
    };

    doc.fontSize(10).font("Helvetica-Oblique").fillColor("#444444");
    doc.text(`Amount in Words: Rupees ${numToWords(Math.round(finalAmt))}`, 50, finalLineY + 35);


    //  FOOTER 
    const bottomY = doc.page.height - 80;
    generateHr(bottomY - 10);
    doc.fillColor("#444444").fontSize(9).font("Helvetica").text("Thank you for shopping with Dumb Phones. Returns policy applies as per website terms. For any queries, please contact support@dumbphones.com.", 50, bottomY, { align: "center", width: 500 });
    doc.text("This is a computer generated invoice and requires no physical signature.", 50, bottomY + 25, { align: "center", width: 500 });

    doc.end();

  } catch (error) {
    console.error("Invoice error:", error);
    res.redirect("/orders");
  }
};



 //  SEARCH ORDERS

export const searchOrders = async (req, res) => {
  try {

    const { q } = req.query;

    if (!q) return res.redirect("/orders");

    let searchTerm = q.replace(/^orderID\s*/i, "").trim();
    if (searchTerm.startsWith("#")) {
      searchTerm = searchTerm.slice(1);
    }

    const orders = await searchUserOrders(
      req.user._id,
      searchTerm
    );

    res.render("user/orders", {
      user: req.user,
      orders,
      q
    });

  } catch (error) {
    console.error("Search error:", error);
    res.redirect("/orders");
  }
};