const express = require("express");
const { isAuth } = require("../../middleware/auth");
const {
    findUserById,
    buildDetailedUserData,
    buildBasicUserData,
    updateUserProfile,
    deleteUserAccount
} = require("../../services/userService");

const router = express.Router();

router.get("/api/session", (req, res) => {
    if (req.session && req.session.user) {
        res.json({ user: req.session.user });
    } else {
        res.status(401).json({ error: "No user session found" });
    }
});

router.get("/api/user/details/:id", async (req, res) => {
    try {
        console.log(`Fetching detailed user info with ID: ${req.params.id}`);
        const user = await findUserById(req.params.id);

        if (!user) {
            console.log(`User not found with ID: ${req.params.id}`);
            return res.status(404).json({ message: "User not found" });
        }

        const userDetails = buildDetailedUserData(user);

        console.log(`Found detailed user info: ${JSON.stringify(userDetails)}`);
        res.json(userDetails);
    } catch (error) {
        console.error(`Error finding detailed user info: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/api/user/:id", async (req, res) => {
    try {
        console.log(`Fetching user with ID: ${req.params.id}`);
        const user = await findUserById(req.params.id);

        if (!user) {
            console.log(`User not found with ID: ${req.params.id}`);
            return res.status(404).json({ message: "User not found" });
        }

        const userData = buildBasicUserData(user);

        console.log(`Found user: ${JSON.stringify(userData)}`);
        res.json(userData);
    } catch (error) {
        console.error(`Error finding user: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.put("/api/user/update", isAuth, async (req, res) => {
    try {
        console.log(`Updating user with ID: ${req.session.user._id}`, req.body);

        const user = await updateUserProfile(req.session.user._id, req.body, req.files);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        req.session.user = user.toObject();

        res.json({
            success: true,
            message: "Profile updated successfully",
            user
        });
    } catch (error) {
        console.error(`Error updating user: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.delete("/api/user/delete", isAuth, async (req, res) => {
    try {
        console.log(`Attempting to delete user account with ID: ${req.session.user._id}`);

        const result = await deleteUserAccount(req.session.user._id, req.body.password);
        res.status(result.status).json(result.body);
    } catch (error) {
        console.error(`Error deleting user account: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

module.exports = router;
