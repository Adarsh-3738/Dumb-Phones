import mongoose from 'mongoose';
import Order from './models/orderSchema.js';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB. Running query...");
    const orders = await Order.find({
      paymentMethod: "Razorpay",
      status: "Delivered",
      finalAmount: { $gte: 20000, $lte: 40000 }
    }).select('orderId paymentMethod status finalAmount createdOn -_id');
    
    console.log("\n================ MONGODB QUERY ================");
    console.log(`db.orders.find({\n  paymentMethod: "Razorpay",\n  status: "Delivered",\n  finalAmount: { $gte: 20000, $lte: 40000 }\n})`);
    
    console.log("\n================ RESULTS ================\n");
    if(orders.length > 0) {
      console.table(orders.map(o => ({
        "Order ID": o.orderId,
        "Payment": o.paymentMethod,
        "Status": o.status,
        "Amount": "₹" + o.finalAmount,
        "Date": o.createdOn.toLocaleDateString()
      })));
      console.log(`Found ${orders.length} orders matching the criteria.`);
    } else {
      console.log("No orders found matching: Razorpay, Delivered, and Amount between ₹20,000 - ₹40,000");
    }
    console.log("\n=========================================\n");
    process.exit(0);
  })
  .catch(err => {
    console.error("Error connecting to DB:", err);
    process.exit(1);
  });
