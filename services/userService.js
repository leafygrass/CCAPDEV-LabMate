const path = require("path");
const argon2 = require("argon2");
const User = require("../database/models/User");
const Reservation = require("../database/models/Reservation");

const UPLOADS_DIRECTORY = path.join(__dirname, "..", "public", "uploads");

async function findUserById(userId) {
    return User.findById(userId);
}

function buildDetailedUserData(user) {
    return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        department: user.department,
        biography: user.biography,
        image: user.image,
        isLabTech: user.type === "Faculty"
    };
}

function buildBasicUserData(user) {
    return {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        isLabTech: user.type === "Faculty"
    };
}

async function updateUserProfile(userId, body, files) {
    const user = await User.findById(userId);

    if (!user) {
        return null;
    }

    user.department = body.department || user.department;
    user.biography = body.biography || user.biography;

    if (files && files.image) {
        const image = files.image;
        const uploadPath = path.join(UPLOADS_DIRECTORY, `${user._id}_${image.name}`);

        await image.mv(uploadPath);
        user.image = `/uploads/${user._id}_${image.name}`;
    }

    await user.save();
    return user;
}

async function deleteUserAccount(userId, password) {
    const user = await User.findById(userId);

    if (!user) {
        return {
            status: 404,
            body: { message: "User not found" }
        };
    }

    const matchPass = await argon2.verify(user.password, password);
    if (!matchPass) {
        return {
            status: 401,
            body: { message: "Incorrect password" }
        };
    }

    await Reservation.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    return {
        status: 200,
        body: { success: true, message: "Account deleted successfully" }
    };
}

module.exports = {
    findUserById,
    buildDetailedUserData,
    buildBasicUserData,
    updateUserProfile,
    deleteUserAccount
};
