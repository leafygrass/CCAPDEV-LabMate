const express = require("express");
const Laboratory = require("../../database/models/Laboratory");

const router = express.Router();

router.get("/api/laboratories/:room", async (req, res) => {
    try {
        const { room } = req.params;
        const laboratory = await Laboratory.findOne({ room });

        if (!laboratory) {
            return res.status(404).json({ message: "Laboratory not found" });
        }

        res.json(laboratory);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

module.exports = router;
