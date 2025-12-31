const mongoose = require("mongoose");
const { Schema } = mongoose;

const brandSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  founded: {
    type: Number,
    required: true
  },
  website: {
    type: String,
    required: true
  },
  logo: {
    type: String,  // single file path
    default: null
  },
  description: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Brand = mongoose.model("Brand", brandSchema);
module.exports = Brand;
