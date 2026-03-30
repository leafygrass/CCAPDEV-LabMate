const User = require("../database/models/User");
const { SESSION_COOKIE_NAME } = require("../config/pageConfigs");

function redirectToUserHome(res, userType) {
    return res.redirect(userType === "Faculty" ? "/labtech-home" : "/student-home");
}

function destroySession(req, res, onComplete) {
    req.session.destroy(() => {
        res.clearCookie(SESSION_COOKIE_NAME);
        onComplete();
    });
}

async function refreshSessionUser(req) {
    const user = await User.findById(req.session.user._id);

    if (!user) {
        return null;
    }

    req.session.user = user.toObject();
    return user;
}

function createGuestOnlyPageHandler(viewName) {
    return (req, res) => {
        if (req.session.user) {
            return redirectToUserHome(res, req.session.user.type);
        }

        res.render(viewName);
    };
}

module.exports = {
    redirectToUserHome,
    destroySession,
    refreshSessionUser,
    createGuestOnlyPageHandler
};
