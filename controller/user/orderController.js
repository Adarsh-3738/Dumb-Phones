import PDFDocument from "pdfkit";

import {
  getUserOrders,
  getUserOrderDetails,
  cancelUserOrder,
  cancelUserOrderItem,
  returnUserOrder,
  searchUserOrders,
  getOrderForInvoice
} from "../../services/user/orderService.js";



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

    res.status(400).json({
      message: error.message
    });

  }
};

// CANCEL SINGLE ITEM
export const cancelOrderItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { reason } = req.body;

    await cancelUserOrderItem(orderId, req.user._id, itemId, reason);

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
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

    res.status(400).json({ success: false, message: error.message });

  }
};



 //  DOWNLOAD INVOICE

export const downloadInvoice = async (req, res) => {
  try {

    const order = await getOrderForInvoice(
      req.params.orderId,
      req.user._id
    );

    if (!order) return res.redirect("/orders");

    const doc = new PDFDocument();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order.orderId}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(20).text(`Invoice`, { align: "center" });
    doc.fontSize(12).text(`Order #: ${order.orderId}`, { align: "center" });
    doc.moveDown(2);

    doc.fontSize(10);
    doc.text(`Date: ${order.createdOn.toDateString()}`);
    doc.text(`Status: ${order.status}`);
    doc.moveDown();
    
    // Draw a line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Table Header
    doc.font('Helvetica-Bold');
    doc.text('Item', 50, doc.y, { continued: true });
    doc.text('Qty', 350, doc.y, { continued: true });
    doc.text('Price', 400, doc.y, { continued: true });
    doc.text('Total', 500, doc.y);
    doc.font('Helvetica');
    
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    let activeSubtotal = 0;

    order.orderedItems.forEach(item => {
      // Only show active items or cross them out if cancelled
      if(item.itemStatus === 'Cancelled') {
        doc.fillColor('gray');
      } else {
        doc.fillColor('black');
        activeSubtotal += (item.price * item.quantity);
      }
      
      const y = doc.y;
      doc.text(`${item.product?.productName || 'Unknown Product'}`, 50, y, { width: 280, continued: false });
      doc.text(`${item.quantity}`, 350, y, { continued: false });
      doc.text(`Rs. ${item.price}`, 400, y, { continued: false });
      doc.text(`Rs. ${item.price * item.quantity}`, 500, y, { continued: false });
      
      if(item.itemStatus === 'Cancelled') {
         doc.fontSize(8).text(`(Cancelled)`, 50, doc.y);
         doc.fontSize(10);
      }
      
      doc.moveDown(0.5);
    });

    doc.fillColor('black');
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Calculate valid parameters from standard metrics
    const tax = order.tax !== undefined ? order.tax : Math.round(activeSubtotal * 0.05);
    const shipping = order.shipping !== undefined ? order.shipping : 0;
    const discount = order.discount || 0;
    const finalAmt = order.finalAmount || (activeSubtotal + tax + shipping - discount);

    // Totals section right aligned
    const totalsStartX = 400;
    const totalsValueX = 500;
    
    doc.text(`Subtotal:`, totalsStartX, doc.y, { continued: false });
    doc.text(`Rs. ${activeSubtotal}`, totalsValueX, doc.y - 12);
    
    doc.text(`Tax (5%):`, totalsStartX, doc.y, { continued: false });
    doc.text(`Rs. ${tax}`, totalsValueX, doc.y - 12);
    
    doc.text(`Shipping:`, totalsStartX, doc.y, { continued: false });
    doc.text(shipping === 0 ? `Free` : `Rs. ${shipping}`, totalsValueX, doc.y - 12);
    
    if (discount > 0) {
      doc.fillColor('green');
      doc.text(`Discount:`, totalsStartX, doc.y, { continued: false });
      doc.text(`- Rs. ${discount}`, totalsValueX, doc.y - 12);
      doc.fillColor('black');
    }

    doc.moveDown(0.5);
    doc.font('Helvetica-Bold');
    doc.text(`Total Paid:`, totalsStartX, doc.y, { continued: false });
    doc.text(`Rs. ${finalAmt}`, totalsValueX, doc.y - 12);
    doc.font('Helvetica');

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