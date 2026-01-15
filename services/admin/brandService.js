import Brand from "../../models/brandSchema.js";

// GET ALL BRANDS
export const fetchBrands = async () => {
  const brands = await Brand.find().lean();
  return { brands, totalBrands: brands.length };
};

// ADD NEW BRAND
export const createBrand = async ({ name, country, founded, website, logo }) => {
  const brand = new Brand({
    name,
    country,
    founded,
    website,
    logo: logo || null,
  });

  await brand.save();
  return brand;
};

// GET BRAND BY ID
export const getBrandById = async (id) => {
  const brand = await Brand.findById(id).lean();
  return brand;
};

// DELETE BRAND BY ID
export const removeBrandById = async (id) => {
  await Brand.findByIdAndDelete(id);
};
