const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const Category = require("../../models/categorySchema");

exports.getProducts = async (req, res) => {
  try {
    const {
      search,
      sort,
      brand,
      category,
      price,
      page = 1
    } = req.query;

    const limit = 9;
    const skip = (page - 1) * limit;

    
    // FILTER OBJECT
     let filter = {
      isBlocked: false
    };

    //  SEARCH 
    if (search) {
      filter.productName = { $regex: search, $options: "i" };
    }

    //  BRAND FILTER
    if (brand) {
      filter.brand = brand;
    }

    //  CATEGORY FILTER
    if (category) {
      filter.category = category;
    }

    // PRICE RANGE FILTER
    if (price) {
      const [min, max] = price.split("-").map(Number);
      filter.salesPrice = { $gte: min, $lte: max };
    }

    
    // SORT LOGIC
    
    let sortOption = {};

    switch (sort) {
      case "priceLowHigh":
        sortOption.salesPrice = 1;
        break;

      case "priceHighLow":
        sortOption.salesPrice = -1;
        break;

      case "nameAZ":
        sortOption.productName = 1;
        break;

      case "nameZA":
        sortOption.productName = -1;
        break;

      default:
        sortOption.createdAt = -1; 
    }

    
    // FETCH DATA
    
    const products = await Product.find(filter)
      .populate("brand")
      .populate("category")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / limit);

    const brands = await Brand.find({ isBlocked: false });
    const categories = await Category.find({ isBlocked: false });

    
    // RENDER
    
    res.render("user/products", {
      products,
      brands,
      categories,
      currentPage: Number(page),
      totalPages,
      search,
      sort,
      brand,
      category,
      price
    });

  } catch (error) {
    console.error("Product fetch error:", error);
    res.status(500).render("user/error", {
      message: "Failed to load products"
    });
  }
};
