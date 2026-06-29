import * as settingsService from "../../services/admin/settingsService.js";
import logger from "../../utils/logger.js";

// GET SETTINGS PAGE
export const getSettings = async (req, res) => {
  try {
    const settings = await settingsService.getOrInitSettings();

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

    const settings = await settingsService.updateTaxRate(parsedTax);

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
