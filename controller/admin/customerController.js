import {
  getCustomers,
  toggleBlockCustomer,
  unblockCustomerById,
} from "../../services/admin/customerService.js";
import logger from "../../utils/logger.js";

// GET CUSTOMERS / SEARCH
export const customerInfo = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;

    logger.info("Loading customers list", {
      search,
      page,
    });

    const { users, totalPages } = await getCustomers(search, page);

    res.render("admin/customers", {
      data: users,
      currentPage: page,
      totalPages,
      searchQuery: search,
    });
  } catch (error) {
    logger.error("Error loading customers", {
      message: error.message,
      stack: error.stack,
      query: req.query,
    });
    res.redirect("/pageNotFound");
  }
};

// BLOCK UNBLOCK CUSTOMER
export const customerBlocked = async (req, res) => {
  try {
    const userId = req.body.id;

    logger.warn("Toggling customer block status", { userId });

    await toggleBlockCustomer(userId);

    logger.info("Customer block status updated", { userId });

    res.json({ success: true });
  } catch (error) {
    logger.error("Error toggling customer block", {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });
    res.json({ success: false });
  }
};

// UNBLOCK CUSTOMER
export const customerunBlocked = async (req, res) => {
  try {
    const userId = req.body.id || req.query.id;

    logger.warn("Unblocking customer", { userId });

    await unblockCustomerById(userId);

    logger.info("Customer unblocked successfully", { userId });

    res.json({ success: true, message: "Customer unblocked successfully" });
  } catch (error) {
    logger.error("Error unblocking customer", {
      message: error.message,
      stack: error.stack,
      query: req.query,
      body: req.body,
    });
    
    res.status(500).json({ success: false, message: "Error unblocking customer" });
  }
};


export const blockCustomer = customerBlocked;
