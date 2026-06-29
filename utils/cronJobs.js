import cron from "node-cron";
import Product from "../models/productSchema.js";
import { recalculateVariantPrices } from "../services/admin/offerService.js";
import logger from "./logger.js";

// Run exactly at midnight every single day (00:00)
export const initCronJobs = () => {
  cron.schedule("0 0 * * *", async () => {
    try {
      logger.info("[CRON] Starting Daily Automated Offer Sync at Midnight");
      
      const products = await Product.find({});
      
      for (const product of products) {
        await recalculateVariantPrices(product._id);
      }
      
      logger.info(`[CRON] Successfully synchronized prices for ${products.length} products`);
    } catch (error) {
      logger.error("[CRON] Error during midnight automated price sync", { error });
    }
  });
};
