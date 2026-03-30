const express = require("express");
const Reservation = require("../../database/models/Reservation");
const Laboratory = require("../../database/models/Laboratory");
const { convertTimeToMinutes } = require("../../utils/time");

const router = express.Router();

router.get("/api/reservations", async (req, res) => {
    try {
        const reservations = await Reservation.find();
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

router.get("/api/reservations/user/:userId", async (req, res) => {
    try {
        const reservations = await Reservation.find({ userId: req.params.userId });
        res.json(reservations);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

router.get("/api/reservation/:id", async (req, res) => {
    try {
        console.log(`Checking reservation with ID: ${req.params.id}`);
        const reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            console.log(`Reservation not found with ID: ${req.params.id}`);
            return res.status(404).json({ message: "Reservation not found" });
        }
        console.log(`Found reservation: ${JSON.stringify(reservation)}`);
        res.json(reservation);
    } catch (error) {
        console.error(`Error finding reservation: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.post("/api/reservation", async (req, res) => {
    try {
        const reservation = new Reservation(req.body);
        await reservation.save();
        res.status(201).json(reservation);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

router.delete("/api/reservation/:id", async (req, res) => {
    try {
        const reservationId = req.params.id;
        console.log(`Attempting to delete reservation with ID: ${reservationId}`);

        const reservation = await Reservation.findByIdAndDelete(reservationId);

        if (!reservation) {
            console.log(`Reservation not found with ID: ${reservationId}`);
            return res.status(404).json({ message: "Reservation not found" });
        }

        console.log(`Successfully deleted reservation with ID: ${reservationId}`);
        res.json({ message: "Reservation deleted successfully" });
    } catch (error) {
        console.error(`Error deleting reservation: ${error.message}`);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.patch("/api/reservation/:id", async (req, res) => {
    try {
        const reservation = await Reservation.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
        if (!reservation) {
            return res.status(404).json({ message: "Reservation not found" });
        }
        res.json(reservation);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
});

router.get("/api/reservations/check-availability", async (req, res) => {
    try {
        const { lab, labId, date, seatNumber, startTime, endTime } = req.query;

        if ((!lab && !labId) || !date || !seatNumber || !startTime || !endTime) {
            return res.status(400).json({ available: false, message: "All parameters are required" });
        }

        let laboratoryRoom = lab;

        if (!laboratoryRoom && labId) {
            const laboratory = await Laboratory.findById(labId);

            if (!laboratory) {
                return res.status(404).json({ available: false, message: "Laboratory not found" });
            }

            laboratoryRoom = laboratory.room;
        }

        const reservationStart = new Date(date);
        reservationStart.setHours(0, 0, 0, 0);

        const reservationEnd = new Date(date);
        reservationEnd.setHours(23, 59, 59, 999);

        const existingReservations = await Reservation.find({
            laboratoryRoom,
            seatNumber: parseInt(seatNumber, 10),
            reservationDate: {
                $gte: reservationStart,
                $lt: reservationEnd
            }
        });

        const requestedStart = convertTimeToMinutes(startTime);
        const requestedEnd = convertTimeToMinutes(endTime);
        const hasConflict = existingReservations.some((reservation) =>
            requestedStart < convertTimeToMinutes(reservation.endTime) &&
            requestedEnd > convertTimeToMinutes(reservation.startTime)
        );

        if (hasConflict) {
            return res.json({ available: false, message: "This seat is already reserved for the selected time range" });
        }

        return res.json({ available: true, message: "Seat is available" });
    } catch (error) {
        console.error("Error checking seat availability:", error);
        res.status(500).json({ available: false, message: "An error occurred while checking seat availability" });
    }
});

router.get("/api/reservations/lab/:labId/date/:date", async (req, res) => {
    try {
        const { labId, date } = req.params;

        if (!labId || !date) {
            return res.status(400).json({ error: "Laboratory and date are required" });
        }

        console.log(`Fetching reservations for lab: ${labId}, date: ${date}`);

        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);

        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);
        console.log(`Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

        const lab = await Laboratory.findById(labId);
        if (!lab) {
            return res.status(404).json({ error: "Laboratory not found" });
        }

        const reservations = await Reservation.find({
            laboratoryRoom: lab.room,
            reservationDate: {
                $gte: startDate,
                $lt: endDate
            }
        }).populate("userId", "firstName lastName image type");

        console.log(`Found ${reservations.length} reservations`);

        const formattedReservations = reservations.map((reservation) => ({
            _id: reservation._id,
            seatNumber: reservation.seatNumber,
            startTime: reservation.startTime,
            endTime: reservation.endTime,
            userId: reservation.userId,
            studentName: reservation.studentName,
            isAnonymous: reservation.isAnonymous
        }));

        res.json({ reservations: formattedReservations });
    } catch (error) {
        console.error("Error fetching reservations:", error);
        res.status(500).json({ error: "An error occurred while fetching reservations" });
    }
});

module.exports = router;
