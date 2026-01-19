import User from "../../models/userSchema.js";

export const getCustomers = async (search = "", page = 1, limit = 3) => {
  const query = {
    isAdmin: false,
    $or: [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ],
  };

  const users = await User.find(query)
    .sort({ _id: -1 })
    .limit(limit)
    .skip((page - 1) * limit);

  const count = await User.countDocuments(query);
  const totalPages = Math.ceil(count / limit);

  return { users, totalPages };
};

export const toggleBlockCustomer = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  user.isBlocked = !user.isBlocked;
  await user.save();
  return user;
};

export const unblockCustomerById = async (id) => {
  const user = await User.findByIdAndUpdate(id, { isBlocked: false });
  return user;
};
