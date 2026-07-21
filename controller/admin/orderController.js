import {
  getOrders,
  getOrderDetails,
  changeOrderStatus,
  changeOrderItemStatus,
} from "../../services/admin/orderService.js";
import STATUS_CODES from "../../utils/statusCodes.js";


// LOAD ORDERS PAGE

export const loadOrders = async (req, res) => {
  try {

    const {
      page = 1,
      limit = 10,
      search = "",
      status = "",
      sort = ""
    } = req.query;

    const { orders, totalPages } = await getOrders({
      page: Number(page),
      limit: Number(limit),
      search,
      status,
      sort
    });


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
    res.render("admin/admin-error", { message: "Failed to load orders. " + error.message });
  }
};



// LOAD ORDER DETAILS

export const loadOrderDetails = async (req, res) => {
  try {

    const { orderId } = req.params;

    const order = await getOrderDetails(orderId);

    if (!order) {
      return res.redirect("/admin/orders");
    }

    console.log("Admin Order Details loaded. Cancel Reason:", order.cancelReason, "Return Reason:", order.returnReason);

    res.render("admin/order-details", { order });

  } catch (err) {
    console.error("Load Order Details Error:", err);
    res.redirect("/admin/orders");
  }
};



// UPDATE ORDER STATUS

export const updateOrderStatus = async (req, res) => {
  try {

    const { orderId } = req.params;
    const { status } = req.body;

    await changeOrderStatus(orderId, status);

    res.json({ success: true });

  } catch (err) {
    console.error(err);

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message
    });
  }
};


// UPDATE SINGLE ITEM STATUS

export const updateOrderItemStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body;

    await changeOrderItemStatus(orderId, itemId, status);

    res.json({ success: true });

  } catch (err) {
    console.error(err);

    res.status(STATUS_CODES.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: err.message
    });
  }
};