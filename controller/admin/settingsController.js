import Settings from "../../models/settingsSchema.js";
import logger from "../../utils/logger.js";

// GET SETTINGS PAGE
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ taxRate: 5 });
    }

    res.render("admin/settings", {
      settings,
      message: null,
      error: null
    });
  } catch (error) {
    logger.error("Error loading settings page", error);
    res.redirect("/admin/pageerror");
  }
};

// UPDATE SETTINGS
export const updateSettings = async (req, res) => {
  try {
    const { taxRate } = req.body;
    
    const parsedTax = parseFloat(taxRate);
    if (isNaN(parsedTax) || parsedTax < 0 || parsedTax > 100) {
      return res.render("admin/settings", {
        settings: { taxRate },
        message: null,
        error: "Invalid tax rate. Please enter a percentage between 0 and 100."
      });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    settings.taxRate = parsedTax;
    await settings.save();

    logger.info(`Tax Rate updated to ${parsedTax}%`);

    res.render("admin/settings", {
      settings,
      message: "Settings updated successfully",
      error: null
    });
  } catch (error) {
    logger.error("Error updating settings", error);
    res.render("admin/settings", {
      settings: req.body,
      message: null,
      error: "Failed to update settings"
    });
  }
};
