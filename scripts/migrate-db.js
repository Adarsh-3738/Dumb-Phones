import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const LOCAL_URI = "mongodb://127.0.0.1:27017/dumbphones";
const CLOUD_URI = process.env.MONGO_URI;

if (!CLOUD_URI) {
  console.error("❌ Error: MONGO_URI is missing in .env file");
  process.exit(1);
}

async function migrateData() {
  console.log("🚀 Starting database migration from Local MongoDB to Cloud Atlas...\n");

  let localConn;
  let cloudConn;

  try {
    // 1. Connect to Local MongoDB
    console.log("📦 Connecting to Local DB (mongodb://127.0.0.1:27017/dumbphones)...");
    localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log("✅ Local DB Connected!");

    // Get all collections
    const collections = await localConn.db.listCollections().toArray();
    if (collections.length === 0) {
      console.log("⚠️ No collections found in local database!");
      await localConn.close();
      process.exit(0);
    }

    // 2. Connect to Cloud MongoDB Atlas
    console.log("☁️ Connecting to Cloud DB Atlas...");
    cloudConn = await mongoose.createConnection(CLOUD_URI).asPromise();
    console.log("✅ Cloud DB Atlas Connected!\n");

    console.log("==================================================");
    console.log(" TRANSFERRING DATA TO CLOUD ATLAS");
    console.log("==================================================");

    let totalDocsCount = 0;

    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith("system.")) continue;

      const localCol = localConn.db.collection(colName);
      const docs = await localCol.find({}).toArray();

      if (docs.length > 0) {
        const cloudCol = cloudConn.db.collection(colName);
        await cloudCol.deleteMany({}); // Clear cloud collection first
        
        try {
          await cloudCol.insertMany(docs, { ordered: false });
          console.log(`  ✓ Collection '${colName}': Transferred ${docs.length} document(s)`);
          totalDocsCount += docs.length;
        } catch (insertErr) {
          const insertedCount = insertErr.result?.nInserted || insertErr.insertedCount || docs.length;
          console.log(`  ✓ Collection '${colName}': Transferred ${insertedCount}/${docs.length} document(s)`);
          totalDocsCount += insertedCount;
        }
      } else {
        console.log(`  - Collection '${colName}': Empty (0 documents)`);
      }
    }

    console.log("==================================================");
    console.log(`🎉 MIGRATION COMPLETE! Transferred ${totalDocsCount} document(s) across all collections.`);
    console.log("==================================================\n");

  } catch (err) {
    console.error("❌ Migration error:", err.message);
  } finally {
    if (localConn) await localConn.close();
    if (cloudConn) await cloudConn.close();
    process.exit(0);
  }
}

migrateData();
