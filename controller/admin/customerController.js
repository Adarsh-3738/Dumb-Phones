const User = require("../../models/userSchema");

const customerInfo = async (req, res) => {
    try {
        let search = req.query.search || "";
        let page = parseInt(req.query.page) || 1;

        const limit = 3;

        const userData = await User.find({
            isAdmin: false,
            $or: [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ],
        })
            .sort({ _id: -1 }) 
            .limit(limit)
            .skip((page - 1) * limit);

        const count = await User.countDocuments({
            isAdmin: false,
            $or: [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ],
        });

        const totalPages = Math.ceil(count / limit);

        res.render("admin/customers", {
            data: userData,
            currentPage: page,
            totalPages: totalPages,
             searchQuery: search,
        });

    } catch (error) {
        console.log("Error in customerInfo", error);
        res.redirect("/pageNotFound");
    }
};

const customerBlocked = async (req, res) => {
    try {
        const userId = req.body.id;
        const user = await User.findById(userId);

        user.isBlocked = !user.isBlocked;
        await user.save();

        return res.json({ success: true });
    } catch (err) {
        return res.json({ success: false });
    }
};

const customerunBlocked = async (req, res) => {
    try {
        const id = req.query.id;
        await User.findByIdAndUpdate(id, { isBlocked: false });
        res.redirect("/admin/users");
    } catch (error) {
        console.log("Error in unblock customer", error);
        res.redirect("/pageNotFound");
    }
};



 const blockCustomer = async (req, res) => {
    try {
        const userId = req.body.id;
        const user = await User.findById(userId);

        user.isBlocked = !user.isBlocked;
        await user.save();

        return res.json({ success: true });
    } catch (err) {
        return res.json({ success: false });
    }
};

module.exports = {
    customerInfo,
    customerBlocked,
    customerunBlocked,
    blockCustomer,
};
