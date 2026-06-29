import Settings from "../../models/settingsSchema.js";

export const getOrInitSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({ taxRate: 5 });
  }
  return settings;
};

export const updateTaxRate = async (parsedTax) => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = new Settings();
  }

  settings.taxRate = parsedTax;
  await settings.save();
  return settings;
};
