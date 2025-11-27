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
        });

    } catch (error) {
        console.log("Error in customerInfo", error);
        res.redirect("/pageNotFound");
    }
};

const customerBlocked = async (req, res) => {
    try {
        const id = req.query.id;
        await User.findByIdAndUpdate(id, { isBlocked: true });
        res.redirect("/admin/users");
    } catch (error) {
        console.log("Error in block customer", error);
        res.redirect("/pageNotFound");
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

module.exports = {
    customerInfo,
    customerBlocked,
    customerunBlocked
};
