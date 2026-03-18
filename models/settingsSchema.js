import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    taxRate: {
      type: Number,
      default: 5,
      min: 0,
      max: 100
    }
  },
  { timestamps: true }
);

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
