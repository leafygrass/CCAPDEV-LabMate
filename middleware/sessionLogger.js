function logSessionState(req, res, next) {
    if (req.session && req.session.user) {
        const rememberPeriodDays = ((req.session.cookie?.maxAge ?? 0) / (24 * 60 * 60 * 1000)).toFixed(1);

        console.log(
            "Current session user:",
            `${req.session.user.firstName} ${req.session.user.lastName}`,
            "/ Times visited:", req.session.visitCount,
            "/ Remember period:", `${rememberPeriodDays} days`
        );
    } else {
        console.log("No user is currently logged in.");
    }

    next();
}

module.exports = {
    logSessionState
};
