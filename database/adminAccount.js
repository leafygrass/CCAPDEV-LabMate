require("../config/loadEnv");

const argon2 = require("argon2");

const User = require("./models/User");

const DEFAULT_ADMIN_EMAIL = "admin@dlsu.edu.ph";
const DEFAULT_ADMIN_PASSWORD = "admin";

async function ensureAdminAccount() {
    const adminCount = await User.countDocuments({ type: "Admin" });

    if (adminCount > 0) {
        return false;
    }

    const existingAdminByEmail = await User.findOne({ email: DEFAULT_ADMIN_EMAIL });

    if (existingAdminByEmail) {
        existingAdminByEmail.type = "Admin";
        await existingAdminByEmail.save();
        console.log(`Promoted existing ${DEFAULT_ADMIN_EMAIL} account to Admin role.`);
        return true;
    }

    const defaultAdminPassword = await argon2.hash(DEFAULT_ADMIN_PASSWORD);

    await User.create({
        type: "Admin",
        firstName: "Admin",
        lastName: "Admin",
        email: DEFAULT_ADMIN_EMAIL,
        biography: "Administrator account",
        password: defaultAdminPassword
    });

    console.log(`Created default Administrator account (${DEFAULT_ADMIN_EMAIL}).`);
    return true;
}

module.exports = {
    DEFAULT_ADMIN_EMAIL,
    DEFAULT_ADMIN_PASSWORD,
    ensureAdminAccount
};
