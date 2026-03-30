function convertTimeToMinutes(timeString) {
    const [time, modifier] = timeString.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier === "P.M." && hours !== 12) hours += 12;
    if (modifier === "A.M." && hours === 12) hours = 0;

    return hours * 60 + minutes;
}

function convertTo24Hour(timeStr) {
    const match = timeStr.match(/(\d+):(\d+) (\w+\.?\w*)/);

    if (!match) {
        return null;
    }

    let [, hours, minutes, period] = match;
    hours = Number(hours);
    minutes = Number(minutes);

    if (period.toUpperCase().includes("P") && hours !== 12) {
        hours += 12;
    } else if (period.toUpperCase().includes("A") && hours === 12) {
        hours = 0;
    }

    return { hours, minutes };
}

function getReservationDateTime(reservationDate, timeString) {
    const reservationDateTime = new Date(reservationDate);
    const reservationTime = convertTo24Hour(timeString);

    if (!reservationTime) {
        return null;
    }

    reservationDateTime.setHours(reservationTime.hours, reservationTime.minutes, 0, 0);
    return reservationDateTime;
}

function convertToHour(time12h) {
    const [time, modifier] = time12h.split(" ");
    let [hours, minutes] = time.split(":");

    if (modifier === "P.M." && hours !== "12") {
        hours = String(parseInt(hours, 10) + 12);
    } else if (modifier === "A.M." && hours === "12") {
        hours = "00";
    }

    return `${hours}:${minutes}`;
}

function timeToNumber(timeStr) {
    return parseInt(timeStr.replace(":", ""), 10);
}

function getStatus(reservation) {
    const reserveDate = new Date(reservation.reservationDate);
    const reservationDate = reserveDate.getFullYear() + "-" + String(reserveDate.getMonth() + 1).padStart(2, "0") + "-" +
        String(reserveDate.getDate()).padStart(2, "0");
    const now = new Date();
    const todayDate = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" +
        String(now.getDate()).padStart(2, "0");

    const startTime = timeToNumber(convertToHour(reservation.startTime));
    const endTime = timeToNumber(convertToHour(reservation.endTime));

    const nowHours = now.getHours().toString().padStart(2, "0");
    const nowMinutes = now.getMinutes().toString().padStart(2, "0");
    const nowTime = parseInt(`${nowHours}${nowMinutes}`, 10);

    if (todayDate === reservationDate && nowTime >= startTime && nowTime < endTime) {
        return "Ongoing";
    }

    return "Upcoming";
}

module.exports = {
    convertTimeToMinutes,
    convertTo24Hour,
    getReservationDateTime,
    convertToHour,
    timeToNumber,
    getStatus
};
