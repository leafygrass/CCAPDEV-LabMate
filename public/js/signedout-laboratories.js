document.addEventListener("DOMContentLoaded", () => {
    const TIME_SLOTS = [
        "07:30 A.M.", "08:00 A.M.", "08:30 A.M.", "09:00 A.M.",
        "09:30 A.M.", "10:00 A.M.", "10:30 A.M.", "11:00 A.M.",
        "11:30 A.M.", "12:00 P.M.", "12:30 P.M.", "01:00 P.M.",
        "01:30 P.M.", "02:00 P.M.", "02:30 P.M.", "03:00 P.M.",
        "03:30 P.M.", "04:00 P.M.", "04:30 P.M.", "05:00 P.M.",
        "05:30 P.M.", "06:00 P.M.", "06:30 P.M.", "07:00 P.M.",
        "07:30 P.M.", "08:00 P.M.", "08:30 P.M.", "09:00 P.M."
    ];

    const elements = {
        labSelect: document.getElementById("labs"),
        dateSelect: document.getElementById("dates"),
        viewButton: document.getElementById("view-button"),
        timetable: document.getElementById("timetable"),
        chartHeader: document.getElementById("chart-header"),
        chartCopy: document.getElementById("chart-copy"),
        seatHoverCard: document.getElementById("seat-hover-card")
    };

    let availabilityLoaded = false;
    let currentReservations = [];
    let currentDisplayTimeSlots = [];

    function formatToday() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, (character) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "\"": "&quot;",
            "'": "&#39;"
        }[character]));
    }

    function toMinutes(timeValue) {
        const match = timeValue.match(/(\d+):(\d+)\s+(A\.M\.|P\.M\.)/);

        if (!match) {
            return 0;
        }

        let [, hour, minute, period] = match;
        hour = parseInt(hour, 10);
        minute = parseInt(minute, 10);

        if (period === "P.M." && hour !== 12) {
            hour += 12;
        }

        if (period === "A.M." && hour === 12) {
            hour = 0;
        }

        return hour * 60 + minute;
    }

    function isTimeInRange(time, startTime, endTime) {
        const currentTime = toMinutes(time);
        const start = toMinutes(startTime);
        const end = toMinutes(endTime);

        return currentTime >= start && currentTime < end;
    }

    function getSelectedLabOption() {
        if (!elements.labSelect || !elements.labSelect.value) {
            return null;
        }

        return elements.labSelect.options[elements.labSelect.selectedIndex];
    }

    function getDisplayTimeSlots(selectedDate) {
        if (selectedDate !== formatToday()) {
            return [...TIME_SLOTS];
        }

        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        return TIME_SLOTS.filter((timeSlot) => toMinutes(timeSlot) > nowMinutes);
    }

    function getSeatReservations(seatNumber) {
        return currentReservations
            .filter((reservation) => reservation.seatNumber.toString() === seatNumber.toString())
            .sort((first, second) => toMinutes(first.startTime) - toMinutes(second.startTime));
    }

    function getValidEndTimes(seatNumber, startTime) {
        const startIndex = TIME_SLOTS.indexOf(startTime);

        if (startIndex === -1 || startIndex >= TIME_SLOTS.length - 1) {
            return [];
        }

        const seatReservations = getSeatReservations(seatNumber);

        if (seatReservations.some((reservation) => isTimeInRange(startTime, reservation.startTime, reservation.endTime))) {
            return [];
        }

        let nextReservationIndex = TIME_SLOTS.length - 1;

        seatReservations.forEach((reservation) => {
            const reservationStartIndex = TIME_SLOTS.indexOf(reservation.startTime);

            if (reservationStartIndex > startIndex && reservationStartIndex < nextReservationIndex) {
                nextReservationIndex = reservationStartIndex;
            }
        });

        const endTimes = [];

        for (let index = startIndex + 1; index <= nextReservationIndex && index < TIME_SLOTS.length; index += 1) {
            endTimes.push(TIME_SLOTS[index]);
        }

        return endTimes;
    }

    function getSelectableStartTimes(seatNumber) {
        return currentDisplayTimeSlots.filter((timeSlot) => getValidEndTimes(seatNumber, timeSlot).length > 0);
    }

    function updateChartCopy() {
        const selectedLab = getSelectedLabOption();
        const selectedDateText = elements.dateSelect?.selectedOptions?.[0]?.text || "";

        if (!selectedLab) {
            elements.chartHeader.textContent = "Seat map";
            elements.chartCopy.textContent = "Choose a laboratory and date to inspect seat bookings.";
            return;
        }

        elements.chartHeader.textContent = selectedLab.dataset.room || "Seat map";
        elements.chartCopy.textContent = `${selectedLab.dataset.hall} | Capacity: ${selectedLab.dataset.capacity} seats${selectedDateText ? ` | ${selectedDateText}` : ""}`;
    }

    function renderEmptyState(message) {
        currentReservations = [];
        currentDisplayTimeSlots = [];
        elements.timetable.innerHTML = `<div class="empty-state-cell">${escapeHtml(message)}</div>`;
    }

    function getSeatCardCopy(seatReservations, isSelectable) {
        if (!currentDisplayTimeSlots.length || currentDisplayTimeSlots.length < 2) {
            return {
                status: "Unavailable",
                hint: "No remaining time slots today"
            };
        }

        if (!seatReservations.length) {
            return {
                status: isSelectable ? "Open all day" : "Unavailable",
                hint: isSelectable ? "No bookings on this date" : "No remaining start times"
            };
        }

        return {
            status: isSelectable
                ? `${seatReservations.length} booking${seatReservations.length === 1 ? "" : "s"}`
                : "Fully booked",
            hint: "Hover to inspect bookings"
        };
    }

    function getReservationOwnerLabel(reservation) {
        if (reservation.userId?.type === "LabTech") {
            return "Walk-in booking";
        }

        if (reservation.isAnonymous) {
            return "Anonymous booking";
        }

        return "Booked by someone";
    }

    function buildSeatHoverCardMarkup(seatNumber) {
        const seatReservations = getSeatReservations(seatNumber);
        const selectableStartTimes = getSelectableStartTimes(seatNumber);
        const subtitle = seatReservations.length
            ? `${seatReservations.length} booking${seatReservations.length === 1 ? "" : "s"} for this date${selectableStartTimes.length ? " with remaining availability." : "."}`
            : "No bookings for this date.";

        if (!seatReservations.length) {
            return `
                <h3 class="seat-hover-card__title">Seat ${escapeHtml(seatNumber)}</h3>
                <p class="seat-hover-card__subtitle">${escapeHtml(subtitle)}</p>
            `;
        }

        const items = seatReservations.map((reservation) => `
            <li class="seat-hover-card__item">
                <span class="seat-hover-card__time">${escapeHtml(`${reservation.startTime} - ${reservation.endTime}`)}</span>
                <span class="seat-hover-card__meta">${escapeHtml(getReservationOwnerLabel(reservation))}</span>
            </li>
        `).join("");

        return `
            <h3 class="seat-hover-card__title">Seat ${escapeHtml(seatNumber)}</h3>
            <p class="seat-hover-card__subtitle">${escapeHtml(subtitle)}</p>
            <ul class="seat-hover-card__list">${items}</ul>
        `;
    }

    function hideSeatHoverCard() {
        if (!elements.seatHoverCard) {
            return;
        }

        elements.seatHoverCard.hidden = true;
        elements.seatHoverCard.innerHTML = "";
    }

    function positionSeatHoverCard(button, event) {
        if (!elements.seatHoverCard || elements.seatHoverCard.hidden) {
            return;
        }

        const card = elements.seatHoverCard;
        const buttonRect = button.getBoundingClientRect();
        const viewportPadding = 16;
        const offset = 18;
        const pointerX = event?.clientX ?? (buttonRect.left + buttonRect.width / 2);
        const pointerY = event?.clientY ?? buttonRect.top;

        card.style.left = "0px";
        card.style.top = "0px";

        const cardWidth = card.offsetWidth;
        const cardHeight = card.offsetHeight;

        let left = pointerX + offset;
        let top = pointerY + offset;

        if (left + cardWidth > window.innerWidth - viewportPadding) {
            left = window.innerWidth - cardWidth - viewportPadding;
        }

        if (top + cardHeight > window.innerHeight - viewportPadding) {
            top = pointerY - cardHeight - offset;
        }

        if (top < viewportPadding) {
            top = viewportPadding;
        }

        if (left < viewportPadding) {
            left = viewportPadding;
        }

        card.style.left = `${left}px`;
        card.style.top = `${top}px`;
    }

    function showSeatHoverCard(button, event) {
        if (!elements.seatHoverCard) {
            return;
        }

        elements.seatHoverCard.innerHTML = buildSeatHoverCardMarkup(button.dataset.seatNumber);
        elements.seatHoverCard.hidden = false;
        positionSeatHoverCard(button, event);
    }

    function renderSeatGrid(capacity) {
        let seatGridMarkup = "";

        for (let seatNumber = 1; seatNumber <= capacity; seatNumber += 1) {
            const seatReservations = getSeatReservations(seatNumber);
            const isSelectable = getSelectableStartTimes(seatNumber).length > 0;
            const seatCopy = getSeatCardCopy(seatReservations, isSelectable);
            const classNames = ["seat-card", isSelectable ? "is-selectable" : "is-unavailable"];

            if (seatReservations.length) {
                classNames.push("has-bookings");
            }

            seatGridMarkup += `
                <button
                    type="button"
                    class="${classNames.join(" ")}"
                    data-seat-number="${seatNumber}"
                    aria-label="Seat ${seatNumber}"
                >
                    <span class="seat-card__number">Seat ${seatNumber}</span>
                    <span class="seat-card__status">${escapeHtml(seatCopy.status)}</span>
                    <span class="seat-card__hint">${escapeHtml(seatCopy.hint)}</span>
                </button>
            `;
        }

        elements.timetable.innerHTML = seatGridMarkup;

        elements.timetable.querySelectorAll(".seat-card").forEach((button) => {
            button.addEventListener("mouseenter", showSeatHoverCard.bind(null, button));
            button.addEventListener("mousemove", positionSeatHoverCard.bind(null, button));
            button.addEventListener("mouseleave", hideSeatHoverCard);
            button.addEventListener("focus", showSeatHoverCard.bind(null, button));
            button.addEventListener("blur", hideSeatHoverCard);
        });
    }

    async function loadAvailability() {
        const selectedLab = getSelectedLabOption();
        const selectedDate = elements.dateSelect?.value || "";
        const capacity = selectedLab ? Number(selectedLab.dataset.capacity) : 0;

        updateChartCopy();
        hideSeatHoverCard();

        if (!selectedLab || !capacity || !selectedDate) {
            renderEmptyState("Choose a laboratory and date to begin.");
            return;
        }

        currentDisplayTimeSlots = getDisplayTimeSlots(selectedDate);

        if (currentDisplayTimeSlots.length < 2) {
            renderEmptyState("No remaining time ranges are available for today. Select another date.");
            return;
        }

        try {
            const response = await fetch(`/api/reservations/lab/${selectedLab.value}/date/${selectedDate}`);
            const data = await response.json();
            currentReservations = data.reservations || [];
            availabilityLoaded = true;
            renderSeatGrid(capacity);
        } catch (error) {
            console.error("Error fetching reservations:", error);
            renderEmptyState("Unable to load availability right now. Please try again.");
        }
    }

    function initializeDefaultSelections() {
        if (elements.labSelect && elements.labSelect.selectedIndex === 0 && elements.labSelect.options.length > 1) {
            elements.labSelect.selectedIndex = 1;
        }

        if (elements.dateSelect && elements.dateSelect.selectedIndex === 0 && elements.dateSelect.options.length > 1) {
            elements.dateSelect.selectedIndex = 1;
        }
    }

    if (!elements.labSelect || !elements.dateSelect || !elements.timetable) {
        return;
    }

    initializeDefaultSelections();
    updateChartCopy();
    loadAvailability();

    elements.viewButton?.addEventListener("click", loadAvailability);

    elements.labSelect.addEventListener("change", () => {
        updateChartCopy();

        if (availabilityLoaded) {
            loadAvailability();
        }
    });

    elements.dateSelect.addEventListener("change", () => {
        updateChartCopy();

        if (availabilityLoaded) {
            loadAvailability();
        }
    });

    window.addEventListener("scroll", hideSeatHoverCard, true);
    window.addEventListener("resize", hideSeatHoverCard);
});
