const Product = require("../../models/productSchema");
const Brand = require("../../models/brandSchema");
const Category = require("../../models/categorySchema");
const cloudinary = require("../../config/cloudinary");

//Resize & optimize images
const { processProductImage } = require("../../helpers/imageProcessor");
const { v4: uuidv4 } = require("uuid");//make unique id for images


exports.getProducts = async (req, res) => {
    let page = Number(req.query.page) || 1;
    let limit = 10;
    let search = req.query.search || "";

    const filter = {
  productName: { $regex: search, $options: "i" }
};


    const products = await Product.find(filter)
        .populate("brand")
        .populate("category")
        .sort({ createdAt: -1 }) // DESCENDING
        .skip((page - 1) * limit)
        .limit(limit);


    const categories = await Category.find({isDeleted:false});
    const brands = await Brand.find({});
    const count = await Product.countDocuments(filter);

    res.render("admin/products", {
        products,
        categories,
        brands,
        search,
        currentPage: page,
        totalPages: Math.ceil(count / limit)
    });
};



// ADD PRODUCT

exports.addProduct = async (req, res) => {
  try {
    const {
  productName,
  regularPrice,
  salesPrice,
  color,
  quantity,
  description,
  category,
  brand
} = req.body;


    //  Validate images
    if (!req.files || req.files.length < 3) {
      return res.render("admin/products", {
        message: "Minimum 3 images required"
      });
    }

  
console.log("BODY:", req.body); //just for debuging
console.log("FILES:", req.files);


    //  Upload each image to Cloudinary
   const productImages = [];

for (const file of req.files) {
  const result = await cloudinary.uploader.upload(file.path, {
    folder: "products",
  });

  productImages.push({
    url: result.secure_url,
    public_id: result.public_id
  });
}

const newProduct = new Product({
  productName,
  regularPrice,
  salesPrice,
  color,
  quantity,
  description,
  category,
  brand,
  productImage: productImages 
});



    await newProduct.save();

    res.redirect("/admin/products");
  } catch (error) {
    console.log("Add product error:", error);
    res.redirect("/admin/page-404");
  }
  
};


// LOAD EDIT PRODUCT PAGE
exports.getEditPage = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("brand")
      .populate("category");

    if (!product) {
      return res.redirect("/admin/products");
    }

    const brands = await Brand.find();
    const categories = await Category.find();

    res.render("admin/edit-product", {
      product,
      brands,
      categories
    });
  } catch (error) {
    console.error(error);
    res.redirect("/admin/products");
  }
};


// UPDATE PRODUCT

exports.editProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.redirect("/admin/products");

    // Upload new images to cloudinary
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "products",
        });

        product.productImage.push({
          url: result.secure_url,
          public_id: result.public_id
        });
      }
    }

    // Update fields
    product.productName = req.body.productName;
    product.regularPrice = req.body.regularPrice;
    product.salesPrice = req.body.salesPrice;
    product.quantity = req.body.quantity;
    product.color = req.body.color;
    product.description = req.body.description;
    product.brand = req.body.brand;
    product.category = req.body.category;

    await product.save();
    res.redirect("/admin/products");
  } catch (error) {
    console.error(error);
    res.redirect("/admin/products");
  }
};




// removing single image ajax
exports.removeProductImage = async (req, res) => {
  try {
    const { productId, publicId } = req.body;

    await cloudinary.uploader.destroy(publicId);

    await Product.findByIdAndUpdate(productId, {
      $pull: { productImage: { public_id: publicId } }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false });
  }
};



// SOFT DELETE PRODUCT

exports.softDeleteProduct =  async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).render("admin/error", {
        message: "Product not found"
      });
    }

    product.isBlocked = !product.isBlocked;
    await product.save();

    res.redirect("/admin/products");
  } catch (err) {
    console.error("Toggle Status Error:", err);
    res.status(500).render("admin/error", {
      message: "Could not update product status"
    });
  }
};





