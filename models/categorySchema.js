const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
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
  { timestamps: true }   // auto adds createdAt & updatedAt
);

module.exports = mongoose.model("Category", categorySchema);
