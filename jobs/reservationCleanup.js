function startReservationCleanupJob(deletePastReservations) {
    const now = new Date();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const millisToNextHalfHour = (30 - minutes % 30) * 60 * 1000 - seconds * 1000;

    deletePastReservations();

    setTimeout(() => {
        deletePastReservations();
        setInterval(deletePastReservations, 30 * 60 * 1000);
    }, millisToNextHalfHour);
}

module.exports = {
    startReservationCleanupJob
};
