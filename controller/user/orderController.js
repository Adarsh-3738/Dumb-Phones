import Order from "../../models/orderSchema.js";
import Product from "../../models/productSchema.js";
import PDFDocument from "pdfkit";
import Address from "../../models/addressSchema.js";
// Load all orders for logged-in user
export const loadOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdOn: -1 });

    res.render("user/orders", {
      user: req.user,
      orders
    });
  } catch (error) {
    console.error("Load orders error:", error);
    res.redirect("/");
  }
};



// Load single order details
export const loadOrderDetails = async (req, res) => {
  try {
    console.log("OrderId from URL:", req.params.orderId);
    console.log("UserId:", req.user._id);

    const order = await Order.findOne({
      orderId: req.params.orderId,
      userId: req.user._id
    })
      .populate("orderedItems.product")
      .populate("address");

    console.log("Order Found:", order);

    if (!order) {
      console.log("❌ Order NOT found");
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



// Cancel full order
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await Order.findOne({
      orderId,
      userId: req.user._id
    });

    if (!order)
      return res.status(404).json({ message: "Order not found" });

    if (order.status === "Cancelled")
      return res.status(400).json({ message: "Order already cancelled" });

    // Restore stock
    for (const item of order.orderedItems) {
      if (item.status === "Active") {
        const product = await Product.findById(item.product);
        product.stock += item.quantity;
        await product.save();

        item.status = "Cancelled";
      }
    }

    order.status = "Cancelled";
    order.cancelReason = reason || "";

    await order.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Request return
export const returnOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    if (!reason) return res.redirect(`/orders/${orderId}`);

    const order = await Order.findOne({
      orderId,
      userId: req.user._id
    });

    if (!order || order.status !== "Delivered") {
      return res.redirect(`/orders/${orderId}`);
    }

    order.status = "Return Request";
    await order.save();

    res.redirect(`/orders/${orderId}`);
  } catch (error) {
    console.error("Return order error:", error);
    res.redirect("/orders");
  }
};


// Download invoice PDF
export const downloadInvoice = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
  orderId,
  userId: req.user._id
}).populate("orderedItems.product");

    if (!order) return res.redirect("/orders");

    const doc = new PDFDocument();
    doc.pipe(res);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${order.orderId}.pdf`
    );

    doc.fontSize(18).text(`Invoice - ${order.orderId}`, { align: "center" });
    doc.moveDown();
    doc.text(`Date: ${order.createdOn.toDateString()}`);
    doc.text(`Status: ${order.status}`);
    doc.moveDown();

    order.orderedItems.forEach(item => {
      doc.text(
        `${item.product.productName} x ${item.quantity} - ₹${item.price * item.quantity}`
      );
    });

    doc.moveDown();
    doc.text(`Final Amount: ₹${order.finalAmount}`);

    doc.end();
  } catch (error) {
    console.error("Invoice error:", error);
    res.redirect("/orders");
  }
};

// Search orders
export const searchOrders = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.redirect("/orders");

    // Only search the UUID part (remove 'orderID ' prefix if present)
    const searchTerm = q.replace(/^orderID\s*/i, "");

    const orders = await Order.find({
      userId: req.user._id,
      orderId: { $regex: searchTerm, $options: "i" }
    }).sort({ createdOn: -1 });

    res.render("user/orders", { user: req.user, orders });
  } catch (error) {
    console.error("Search error:", error);
    res.redirect("/orders");
  }
};

