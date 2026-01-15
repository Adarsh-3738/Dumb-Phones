import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    description: {
      type: String,
      default: ""
    },
    status: {
      type: String,
      enum: ["Active", "Draft"],
      default: "Active"
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    isListed: {
      type: Boolean,
      default: true
    },
    categoryOffer: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true } // auto adds createdAt & updatedAt
);

const Category = mongoose.model("Category", categorySchema);

export default Category;
