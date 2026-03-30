const Reservation = require("../database/models/Reservation");
const Laboratory = require("../database/models/Laboratory");
const User = require("../database/models/User");
const { timeSlots } = require("../database/models/TimeSlotOptions");
const {
    LAB_DATE_FORMAT_OPTIONS,
    RESERVATION_DATE_FORMAT_OPTIONS,
    PROFILE_DATE_FORMAT_OPTIONS,
    DEFAULT_UPCOMING_LAB_MESSAGE
} = require("../config/pageConfigs");
const {
    convertTimeToMinutes,
    getReservationDateTime,
    getStatus
} = require("../utils/time");

function buildNext7Days() {
    const today = new Date();

    return Array.from({ length: 8 }, (_, offset) => {
        const date = new Date();
        date.setDate(today.getDate() + offset);

        return {
            formattedDate: date.toISOString().split("T")[0],
            displayDate: date.toLocaleDateString("en-US", LAB_DATE_FORMAT_OPTIONS)
        };
    });
}

async function getLaboratoryPageData(userFields) {
    const [labs, reservations] = await Promise.all([
        Laboratory.find({}).lean(),
        Reservation.find().lean().populate("userId", userFields)
    ]);

    return {
        labs,
        next7Days: buildNext7Days(),
        timeSlots,
        reservations
    };
}

function sortReservationsBySchedule(reservations) {
    return reservations.sort((a, b) => {
        const dateComparison = new Date(a.reservationDate) - new Date(b.reservationDate);
        if (dateComparison !== 0) return dateComparison;

        const startTimeComparison = convertTimeToMinutes(a.startTime) - convertTimeToMinutes(b.startTime);
        if (startTimeComparison !== 0) return startTimeComparison;

        return convertTimeToMinutes(a.endTime) - convertTimeToMinutes(b.endTime);
    });
}

async function getSortedReservations(query = {}, select) {
    let reservationQuery = Reservation.find(query);

    if (select) {
        reservationQuery = reservationQuery.select(select);
    }

    return sortReservationsBySchedule(await reservationQuery.lean());
}

function formatReservationDate(reservationDate) {
    return new Date(reservationDate).toLocaleDateString("en-US", RESERVATION_DATE_FORMAT_OPTIONS);
}

function formatReservationsForList(reservations) {
    return reservations.map((reservation) => ({
        ...reservation,
        reservationDate: formatReservationDate(reservation.reservationDate)
    }));
}

function getRemovableReservationIds(reservations) {
    const currentDate = new Date();

    return reservations.reduce((removableReservations, reservation) => {
        const reservationDateTime = getReservationDateTime(reservation.reservationDate, reservation.startTime);

        if (!reservationDateTime) {
            return removableReservations;
        }

        const timeDiff = (currentDate - reservationDateTime) / (1000 * 60);
        const currentDateGMT8 = currentDate.toLocaleDateString("en-US", RESERVATION_DATE_FORMAT_OPTIONS);

        console.log(`Time Diff: ${timeDiff} Reservation Date: ${reservationDateTime} Current Date: ${currentDate}Date (GMT+8): ${currentDateGMT8}`);

        if (timeDiff >= 10) {
            removableReservations.push(reservation._id);
        }

        return removableReservations;
    }, []);
}

function formatProfileReservation(reservation) {
    return {
        lab: reservation.laboratoryRoom,
        date: new Date(reservation.reservationDate).toLocaleDateString("en-US", PROFILE_DATE_FORMAT_OPTIONS),
        time: `${reservation.startTime} - ${reservation.endTime}`,
        seat: reservation.seatNumber,
        status: getStatus(reservation)
    };
}

function getUpcomingLabSummary(reservations) {
    const now = new Date();

    const upcomingReservations = reservations
        .filter((reservation) => {
            const reservationDateTime = getReservationDateTime(reservation.reservationDate, reservation.startTime);
            return reservationDateTime && reservationDateTime > now;
        })
        .sort((one, two) => (
            getReservationDateTime(one.reservationDate, one.startTime) -
            getReservationDateTime(two.reservationDate, two.startTime)
        ));

    if (upcomingReservations.length === 0) {
        return DEFAULT_UPCOMING_LAB_MESSAGE;
    }

    const nextReservation = upcomingReservations[0];
    return `${nextReservation.laboratoryRoom} on ${new Date(nextReservation.reservationDate).toLocaleDateString("en-US", PROFILE_DATE_FORMAT_OPTIONS)} at ${nextReservation.startTime}`;
}

function normalizeReservationDate(date) {
    const reservationDate = new Date(date);
    reservationDate.setDate(reservationDate.getDate() - 1);
    reservationDate.setHours(24, 0, 0, 0);
    return reservationDate;
}

async function createReservationAndRedirect(req, res, redirectPath, options = {}) {
    const { includeAnonymous = false } = options;
    const { labId, date, seatNumber, startTime, endTime, userId, isAnonymous } = req.body;
    const parsedSeatNumber = parseInt(seatNumber, 10);

    if (!labId || !date || !seatNumber || !startTime || !endTime || !userId) {
        return res.status(400).send("All fields are required");
    }

    console.log("Creating reservation with data:", req.body);

    const reservationDate = normalizeReservationDate(date);
    const lab = await Laboratory.findById(labId);

    if (!lab) {
        return res.status(404).send("Laboratory not found");
    }

    const existingReservation = await Reservation.findOne({
        laboratoryRoom: lab.room,
        seatNumber: parsedSeatNumber,
        reservationDate,
        startTime
    });

    if (existingReservation) {
        return res.status(400).send("This seat is already reserved for the selected time");
    }

    const user = await User.findById(userId);

    if (!user) {
        return res.status(404).send("User not found");
    }

    const reservationPayload = {
        userId,
        studentName: `${user.firstName} ${user.lastName}`,
        laboratoryRoom: lab.room,
        seatNumber: parsedSeatNumber,
        bookingDate: new Date(),
        reservationDate,
        startTime,
        endTime
    };

    if (includeAnonymous) {
        reservationPayload.isAnonymous = isAnonymous;
    }

    await new Reservation(reservationPayload).save();
    res.redirect(redirectPath);
}

async function deletePastReservations() {
    try {
        const currentDateTime = new Date();
        const reservations = await Reservation.find({});

        let deletionsOccurred = false;

        const pastReservations = reservations.filter((reservation) => {
            const reservationDateTime = getReservationDateTime(reservation.reservationDate, reservation.endTime);
            return reservationDateTime && reservationDateTime <= currentDateTime;
        });

        if (pastReservations.length > 0) {
            await Promise.all(pastReservations.map(async (reservation) => {
                await Reservation.findByIdAndDelete(reservation._id);
                console.log(`Deleted past reservation: ${reservation.laboratoryRoom} on ${reservation.reservationDate}`);
            }));
            deletionsOccurred = true;
        }

        if (deletionsOccurred) {
            console.log("Reservation Deletion Check: Past reservations deleted.");
        } else {
            console.log("Reservation Deletion Check: All reservations are ongoing/upcoming.");
        }
    } catch (error) {
        console.error("Error deleting past reservations:", error);
    }
}

module.exports = {
    getLaboratoryPageData,
    getSortedReservations,
    formatReservationsForList,
    getRemovableReservationIds,
    formatProfileReservation,
    getUpcomingLabSummary,
    createReservationAndRedirect,
    deletePastReservations
};
