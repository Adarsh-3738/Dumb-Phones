import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import Order from "./models/orderSchema.js";

mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/DumbPhones").then(async () => {
    try {
      console.log("Connected to MongoDB, searching for Delivered orders in Kollam...\n");

      // Running the aggregation pipeline
      const orders = await Order.aggregate([
        {
          $match: {
            status: "Delivered",
            "address.city": { $regex: /^kollam$/i }
          }
        }
      ]);
      
      console.log(`Found ${orders.length} Delivered orders in Kollam:`);
      console.dir(orders, { depth: null });
      
    } catch (error) {
      console.error("Query failed:", error);
    } finally {
      process.exit(0);
    }
});
