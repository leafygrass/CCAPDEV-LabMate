function isAuth(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        res.redirect("/signin-page");
    }
}

function createRoleGuard(expectedType, redirectPath) {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.redirect("/signin-page");
        }

        if (req.session.user.type !== expectedType) {
            return res.redirect(redirectPath);
        }

        next();
    };
}

const requireStudent = createRoleGuard("Student", "/labtech-home");
const requireLabtech = createRoleGuard("Faculty", "/student-home");

module.exports = {
    isAuth,
    createRoleGuard,
    requireStudent,
    requireLabtech
};
