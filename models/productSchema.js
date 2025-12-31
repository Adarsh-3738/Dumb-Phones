const mongoose = require("mongoose");
const { Schema } = mongoose;

const ProductSchema = new Schema({
    productName:{
        type:String,
        required:true,
    },
    description:{
        type:String,
        required:true,
    },
    brand: { 
         type: mongoose.Schema.Types.ObjectId,
         ref: "Brand",
         required: true },
    
    category:{
        type:Schema.Types.ObjectId,
        ref:"Category",
        required:true,
    },
    regularPrice:{
        type:Number,
        required:true,
    },
    salesPrice:{
        type:Number,
        required: true
    },
    productOffer:{
        type:Number,
        default:0,
    },
    quantity:{
        type:Number,
        default:0,
    },
    color:{
        type:String,
        required:true
    },
    productImage: [
  {
    url: String,
    public_id: String //for removing images from cloudinary
  }
]
,
    isBlocked:{
        type:Boolean,
        default:false
    },
    status:{
        type:String,
        enum:["Available","out of stock","Discontinued"],
        required:true,
        default:"Available"
    },   
    },{timestamps:true});


    const Product = mongoose.model("Product",ProductSchema);

    module.exports = Product;