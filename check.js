import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Order from "./models/orderSchema.js";

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/DumbPhones").then(async () => {
    const statuses = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    console.log("Order statuses found:", statuses);
    process.exit(0);
});
