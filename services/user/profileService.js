import User from "../../models/userSchema.js";
import Address from "../../models/addressSchema.js";
import bcrypt from "bcryptjs";

// PROFILE

export const getUserById = async (userId) => {
  return await User.findById(userId);
};

export const getUserAddresses = async (userId) => {
  return await Address.findOne({ userId });
};

export const updateUserProfile = async (userId, data) => {
  const user = await User.findById(userId);

  user.name = data.name;
  user.phone = data.phone;

  if (data.profileImage) {
    user.profileImage = data.profileImage;
  }

  return await user.save();
};


// EMAIL

export const checkEmailExists = async (email) => {
  return await User.findOne({ email });
};

export const updateUserEmail = async (userId, newEmail) => {
  return await User.findByIdAndUpdate(
    userId,
    { email: newEmail },
    { new: true }
  );
};


// PASSWORD 

export const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

export const updatePassword = async (user, newPassword) => {
  user.password = await bcrypt.hash(newPassword, 10);
  return await user.save();
};


// ADDRESS 

export const getAddresses = async (userId) => {
  return await Address.findOne({ userId });
};

export const addNewAddress = async (userId, addressData) => {
  let addressDoc = await Address.findOne({ userId });

  if (addressDoc) {
    addressDoc.address.push(addressData);
    return await addressDoc.save();
  }

  return await Address.create({
    userId,
    address: [addressData]
  });
};

export const getSingleAddress = async (userId, addressId) => {
  return await Address.findOne(
    { userId, "address._id": addressId },
    { "address.$": 1 }
  );
};

export const updateUserAddress = async (userId, addressId, data) => {
  return await Address.updateOne(
    { userId, "address._id": addressId },
    {
      $set: {
        "address.$.addressType": data.addressType,
        "address.$.name": data.name,
        "address.$.city": data.city,
        "address.$.landmark": data.landmark,
        "address.$.state": data.state,
        "address.$.pincode": data.pincode,
        "address.$.phone": data.phone,
        "address.$.altPhone": data.altPhone
      }
    }
  );
};

export const deleteUserAddress = async (userId, addressId) => {
  return await Address.updateOne(
    { userId },
    { $pull: { address: { _id: addressId } } }
  );
};