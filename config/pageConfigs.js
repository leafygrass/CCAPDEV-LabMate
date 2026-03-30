const DATABASE_URI = "mongodb://localhost/LabMateDB";
const REMEMBER_ME_DURATION_MS = 3 * 7 * 24 * 60 * 60 * 1000;
const SESSION_COOKIE_NAME = "connect.sid";
const RESERVATION_DATE_FORMAT_OPTIONS = {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
};
const PROFILE_DATE_FORMAT_OPTIONS = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
};
const LAB_DATE_FORMAT_OPTIONS = {
    weekday: "long",
    month: "long",
    day: "numeric"
};
const PROFILE_SECTION_HASHES = {
    dashboard: "#dashboard",
    overview: "#dashboard",
    view: "#view",
    account: "#view",
    edit: "#edit",
    password: "#password",
    delete: "#delete",
    logout: "#logout"
};
const DEFAULT_UPCOMING_LAB_MESSAGE = "No upcoming reservations.";
const LABORATORY_PAGE_CONFIGS = {
    student: {
        pageHeading: "Reserve a Slot",
        reserveButtonLabel: "Create Booking",
        reservationAction: "/create-reservation",
        missingSelectionMessage: "Please select a laboratory, date, end time, and seat before reserving.",
        allowAnonymous: true,
        isWalkInMode: false
    },
    labtech: {
        pageHeading: "Reserve for Walk-ins",
        reserveButtonLabel: "Create Booking for Walk-In",
        reservationAction: "/create-reservation-labtech",
        missingSelectionMessage: "Please make sure all input fields are filled.",
        allowAnonymous: false,
        isWalkInMode: true
    }
};
const HOME_PAGE_CONFIGS = {
    student: {
        homeStylesheet: "/css/student-home.css",
        laboratoriesPath: "/student-laboratories",
        reservationsPath: "/student-reservations"
    },
    labtech: {
        homeStylesheet: "/css/labtech-home.css",
        laboratoriesPath: "/labtech-laboratories",
        reservationsPath: "/labtech-reservations"
    }
};
const RESERVATIONS_PAGE_CONFIGS = {
    student: {
        pageHeading: "Your Reservations"
    },
    labtech: {
        pageHeading: "Student Reservations",
        pageSubheading: "Deleting student reservations are only possible within 10 minutes of their time slot."
    }
};

module.exports = {
    DATABASE_URI,
    REMEMBER_ME_DURATION_MS,
    SESSION_COOKIE_NAME,
    RESERVATION_DATE_FORMAT_OPTIONS,
    PROFILE_DATE_FORMAT_OPTIONS,
    LAB_DATE_FORMAT_OPTIONS,
    PROFILE_SECTION_HASHES,
    DEFAULT_UPCOMING_LAB_MESSAGE,
    LABORATORY_PAGE_CONFIGS,
    HOME_PAGE_CONFIGS,
    RESERVATIONS_PAGE_CONFIGS
};
