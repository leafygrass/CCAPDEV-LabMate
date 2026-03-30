const express = require("express");
const {
    HOME_PAGE_CONFIGS,
    LABORATORY_PAGE_CONFIGS,
    RESERVATIONS_PAGE_CONFIGS
} = require("../config/pageConfigs");
const { isAuth, requireStudent } = require("../middleware/auth");
const {
    renderHomePage,
    renderLaboratoryPage,
    renderReservationsPage,
    renderProfilePage,
    createProfileSectionRedirectHandler
} = require("../services/pageService");
const { createReservationAndRedirect } = require("../services/reservationService");

const router = express.Router();

router.get("/student-home", isAuth, requireStudent, async (req, res) => {
    await renderHomePage(req, res, HOME_PAGE_CONFIGS.student);
});

router.get("/student-laboratories", isAuth, requireStudent, async (req, res) => {
    await renderLaboratoryPage(
        req,
        res,
        "laboratories",
        "firstName lastName type",
        LABORATORY_PAGE_CONFIGS.student,
        true
    );
});

router.get("/student-reservations", isAuth, requireStudent, async (req, res) => {
    await renderReservationsPage(
        req,
        res,
        { userId: req.session.user._id },
        RESERVATIONS_PAGE_CONFIGS.student
    );
});

router.get("/student-profile", isAuth, requireStudent, async (req, res) => {
    await renderProfilePage(req, res, { userId: req.session.user._id });
});

router.get(
    "/profile-:section",
    isAuth,
    requireStudent,
    createProfileSectionRedirectHandler("/student-profile")
);

router.post("/create-reservation", isAuth, requireStudent, async (req, res) => {
    try {
        await createReservationAndRedirect(req, res, "/student-reservations", { includeAnonymous: true });
    } catch (error) {
        console.error("Error creating reservation:", error);
        res.status(500).send("An error occurred while creating the reservation");
    }
});

module.exports = router;
