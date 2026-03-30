const express = require("express");
const {
    HOME_PAGE_CONFIGS,
    LABORATORY_PAGE_CONFIGS,
    RESERVATIONS_PAGE_CONFIGS
} = require("../config/pageConfigs");
const { isAuth, requireLabtech } = require("../middleware/auth");
const {
    renderHomePage,
    renderLaboratoryPage,
    renderReservationsPage,
    renderProfilePage,
    createProfileSectionRedirectHandler
} = require("../services/pageService");
const { createReservationAndRedirect } = require("../services/reservationService");

const router = express.Router();

router.get("/labtech-home", isAuth, requireLabtech, async (req, res) => {
    await renderHomePage(req, res, HOME_PAGE_CONFIGS.labtech);
});

router.get("/labtech-laboratories", isAuth, requireLabtech, async (req, res) => {
    await renderLaboratoryPage(
        req,
        res,
        "laboratories",
        "firstName lastName type",
        LABORATORY_PAGE_CONFIGS.labtech,
        true
    );
});

router.get("/labtech-reservations", isAuth, requireLabtech, async (req, res) => {
    await renderReservationsPage(
        req,
        res,
        {},
        RESERVATIONS_PAGE_CONFIGS.labtech,
        true
    );
});

router.get("/labtech-profile", isAuth, requireLabtech, async (req, res) => {
    await renderProfilePage(req, res, { userId: req.session.user._id });
});

router.get(
    "/labtech-profile-:section",
    isAuth,
    requireLabtech,
    createProfileSectionRedirectHandler("/labtech-profile")
);

router.post("/create-reservation-labtech", isAuth, requireLabtech, async (req, res) => {
    try {
        await createReservationAndRedirect(req, res, "/labtech-reservations");
    } catch (error) {
        console.error("Error creating reservation:", error);
        res.status(500).send("An error occurred while creating the reservation");
    }
});

module.exports = router;
