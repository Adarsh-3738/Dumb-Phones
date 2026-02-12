import Order from "../../models/orderSchema.js";
import User from "../../models/userSchema.js";

// Load all orders with pagination, search, filter
export const loadOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      sort = ""
    } = req.query;

    // -----------------------------
    // Build filter query
    // -----------------------------
    const query = {};

    if (search) {
      query.orderId = { $regex: search, $options: "i" };
    }

    if (status) {
      query.status = status;
    }

    // -----------------------------
    // Build sort option
    // -----------------------------
    let sortOption = { createdOn: -1 }; // default: newest first

    switch (sort) {
      case "date_asc":
        sortOption = { createdOn: 1 };
        break;

      case "date_desc":
        sortOption = { createdOn: -1 };
        break;

      case "amount_asc":
        sortOption = { finalAmount: 1 };
        break;

      case "amount_desc":
        sortOption = { finalAmount: -1 };
        break;
    }

    // -----------------------------
    // Pagination calculation
    // -----------------------------
    const skip = (page - 1) * limit;

    // -----------------------------
    // Fetch orders
    // -----------------------------
    const orders = await Order.find(query)
      .populate("userId", "name email")
      .populate("address")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    // -----------------------------
    // Render page
    // -----------------------------
    res.render("admin/orders", {
      orders,
      currentPage: Number(page),
      totalPages,
      search,
      status,
      sort
    });
  } catch (error) {
    console.error("Admin loadOrders error:", error);
    res.redirect("/admin");
  }
};

// Load single order details
export const loadOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId })
      .populate("userId", "name email phone")
      .populate("orderedItems.product")
      .populate("address");

    if (!order) return res.redirect("/admin/orders");

    res.render("admin/order-details", { order });
  } catch (err) {
    console.error(err);
    res.redirect("/admin/orders");
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findOne({ orderId });
    if (!order) return res.status(404).json({ success: false });

    order.status = status;
    await order.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};
