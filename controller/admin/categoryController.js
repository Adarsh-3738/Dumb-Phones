

// controller/admin/categoryController.js
const Category = require("../../models/categorySchema");


// ----------------------- CATEGORY LIST -----------------------
const categoryInfo = async (req, res) => {
  try {
    const searchQuery = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = 5;

    const filter = {
  isDeleted: false,
  name: { $regex: searchQuery, $options: "i" }
};


    const totalCategories = await Category.countDocuments(filter);
    const totalPages = Math.ceil(totalCategories / limit);

    const categories = await Category.find(filter)
      .sort({ createdAt: -1 }) // latest first
      .skip((page - 1) * limit)
      .limit(limit);

    res.render("admin/category", {
      categories,
      currentPage: page,
      totalPages,
      searchQuery,
      totalCategories
    });
  } catch (error) {
    console.log("Category loading error:", error);
    res.redirect("/admin/page-error");
  }
};

// ----------------------- ADD CATEGORY -----------------------

const addCategory = async (req, res) => {
  try {
    const { name } = req.body;

    const exists = await Category.findOne({ name, isListed: true });
    if (exists) return res.json({ success: false, msg: "Category already exists" });

    await Category.create({
      name,
      status: "Active",
      description: "",
      categoryOffer: 0
    });

    return res.json({ success: true });
  } catch (error) {
    console.log("ADD CATEGORY ERROR:", error);
    return res.json({ success: false });
  }
};

module.exports = { addCategory };

// ----------------------- EDIT CATEGORY -----------------------
const editCategory = async (req, res) => {
  try {
    const { id, name, status } = req.body;

    const exists = await Category.findOne({
      _id: { $ne: id },
      name,
      isDeleted: false
    });

    if (exists) return res.json({ success: false, msg: "Category name already exists" });

    await Category.findByIdAndUpdate(id, { name, status });

    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.json({ success: false });
  }
};

// ----------------------- SOFT DELETE -----------------------
const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndUpdate(req.body.id, { isDeleted: true });
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.json({ success: false });
  }
};

module.exports = {
  categoryInfo,
  addCategory,
  editCategory,
  deleteCategory
};






















// const Category = require ("../../models/categorySchema");


// const categoryInfo = async (req,res) =>{
//     try{
//         const page = parseInt(req.query.page) || 1;
//         const limit = 4;
//         const skip = (page-1) *limit;


//         const categoryData = await Category.find ({})
//         .sort ({createdAt: - 1})
//         .skip(skip)
//         .limit(limit);


//         const totalCategories = await Category.countDocuments();
//         const totalPages = Math.ceil (totalCategories / limit);
//         res.render ("admin/category", {
//         categories: categoryData,
//          currentPage: page,
//         totalPages : totalPages,
//         totalCategories: totalCategories
//         });


//     }catch(error){
//         console.log(error);
//         res.redirect("/pageerror");
//     }
//     }


// const addCategory = async(req,res)=>{
//     const {name,description} = req.body;
//     try{
//         const existingCategory = await Category.findOne({name});
//         if(existingCategory){
//             return res.status (400).json({error: "Category already exists"})
//         }

//         const newCategory = new Category({
//             name,
//             description,

//         })
//         await newCategory.save();
//         return res.json({message:"Category added successfully " })

//     }
//     catch(error){
//         return res.status(500).json({error:"Internal Server Error"})
//     }
    
// }











//     module.exports ={
//         categoryInfo,
//         addCategory,
//     }