const { getHomePathByType } = require("../services/sessionService");

function isAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/signin-page");
    }
}

function createRoleGuard(expectedType, fallbackRedirectPath = "/student-home") {
    const expectedTypes = Array.isArray(expectedType) ? expectedType : [expectedType];

    return (req, res, next) => {
        if (!req.session.user) {
            return res.redirect("/signin-page");
        }

        if (!expectedTypes.includes(req.session.user.type)) {
            return res.redirect(getHomePathByType(req.session.user.type) || fallbackRedirectPath);
        }

        next();
    };
}

const requireStudent = createRoleGuard("Student");
const requireLabtech = createRoleGuard("LabTech");
const requireAdmin = createRoleGuard("Admin");

module.exports = {
    isAuth,
    createRoleGuard,
    requireStudent,
    requireLabtech,
    requireAdmin
};
