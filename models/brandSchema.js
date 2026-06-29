import mongoose from "mongoose";

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
  
  description: {
    type: String
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Brand = mongoose.model("Brand", brandSchema);

export default Brand;
