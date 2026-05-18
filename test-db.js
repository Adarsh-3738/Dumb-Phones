import mongoose from "mongoose";
import Order from "./models/orderSchema.js";

mongoose.connect("mongodb://localhost:27017/dumbphones", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const orders = await Order.find({ status: "Delivered" }).limit(50);
    const blankOrders = orders.filter(o => o.totalPrice === 0 || !o.totalPrice || Number.isNaN(o.totalPrice));
    console.log("Blank totalPrice orders:", blankOrders.length);
    for (let o of blankOrders) {
      console.log(o.orderId, "totalPrice:", o.totalPrice, "finalAmount:", o.finalAmount, "status:", o.status);
    }
    
    // Also check if there's any returned items
    const returnedItemsOrders = orders.filter(o => o.orderedItems.some(i => i.itemStatus === 'Returned'));
    console.log("Orders with returned items:", returnedItemsOrders.length);
    for (let o of returnedItemsOrders) {
      console.log(o.orderId, "totalPrice:", o.totalPrice, "finalAmount:", o.finalAmount);
    }
    
    mongoose.disconnect();
  });
