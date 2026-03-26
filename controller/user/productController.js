import productService from "../../services/user/productService.js";
import logger from "../../utils/logger.js";

// GET PRODUCTS
export const getProducts = async (req, res) => {
  try {
    logger.info("Loading user products listing", {
      query: req.query,
    });

    const data = await productService.getProductsService(req.query);

    res.render("user/shop", {
      ...data,
      search: req.query.search,
      sort: req.query.sort,
      brand: req.query.brand,
      category: req.query.category,
      price: req.query.price,
      user: req.user || null
    });
  } catch (error) {
    logger.error("Error fetching user products", {
      message: error.message,
      stack: error.stack,
      query: req.query,
    });

    res.status(500).render("user/page-404", {
      message: "Failed to load products",
    });
  }
};

// PRODUCT DETAILS PAGE
export const loadProductDetails = async (req, res) => {
  try {
    const productId = req.params.id;

    logger.info("Loading product details page", {
      productId
    });

    
    const {
      product,
      variants,
      similarProducts
    } = await productService.getProductDetailsService(productId);

    
    res.render("user/productDetails", {
      product,
      variants,
      similarProducts,
      
    });

  } catch (error) {
    logger.error("Error loading product details", {
      message: error.message,
      stack: error.stack,
      productId: req.params.id
    });

    if (error.message === "PRODUCT_NOT_FOUND") {
      logger.warn("Product not found", {
        productId: req.params.id
      });
      return res.status(404).render("user/page-404");
    }

    res.status(500).render("user/page-404");
  }
};
