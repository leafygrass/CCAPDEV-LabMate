(function() {
    const config = window.LABORATORIES_PAGE_CONFIG || {};
    const TIME_SLOTS = [
        "07:30 A.M.", "08:00 A.M.", "08:30 A.M.", "09:00 A.M.",
        "09:30 A.M.", "10:00 A.M.", "10:30 A.M.", "11:00 A.M.",
        "11:30 A.M.", "12:00 P.M.", "12:30 P.M.", "01:00 P.M.",
        "01:30 P.M.", "02:00 P.M.", "02:30 P.M.", "03:00 P.M.",
        "03:30 P.M.", "04:00 P.M.", "04:30 P.M.", "05:00 P.M.",
        "05:30 P.M.", "06:00 P.M.", "06:30 P.M.", "07:00 P.M.",
        "07:30 P.M.", "08:00 P.M.", "08:30 P.M.", "09:00 P.M."
    ];

    let selectedSeatButton = null;
    let availabilityLoaded = false;
    let currentReservations = [];
    let currentDisplayTimeSlots = [];

    function getElements() {
        return {
            labSelect: document.getElementById("labs"),
            dateSelect: document.getElementById("dates"),
            startTimeSelect: document.getElementById("starttimes"),
            endTimeSelect: document.getElementById("endtimes"),
            labButtons: Array.from(document.querySelectorAll(".lab-option")),
            viewButton: document.getElementById("view-button"),
            reserveButton: document.getElementById("reserve-button"),
            timetable: document.getElementById("timetable"),
            chartHeader: document.getElementById("chart-header"),
            selectedLabName: document.getElementById("selected-lab-name"),
            selectedLabMeta: document.getElementById("selected-lab-meta"),
            summaryLab: document.getElementById("summary-lab"),
            summaryDate: document.getElementById("summary-date"),
            summarySeat: document.getElementById("summary-seat"),
            summaryStart: document.getElementById("summary-start"),
            summaryEnd: document.getElementById("summary-end"),
            summaryDuration: document.getElementById("summary-duration"),
            selectedSeatChip: document.getElementById("selected-seat-chip"),
            selectedTimeChip: document.getElementById("selected-time-chip"),
            seatHoverCard: document.getElementById("seat-hover-card"),
            confirmPopup: document.getElementById("confirm-popup"),
            overlay: document.getElementById("overlay"),
            confirmCancel: document.getElementById("confirm-cancel-button"),
            confirmSubmit: document.getElementById("confirm-submit-button")
        };
    }

    function formatToday() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    function toMinutes(timeString) {
        const match = timeString.match(/(\d+):(\d+)\s+(A\.M\.|P\.M\.)/);

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

    function getDurationLabel(startTime, endTime) {
        if (!startTime || !endTime) {
            return "Select a start and end time";
        }

        const durationMinutes = toMinutes(endTime) - toMinutes(startTime);

        if (durationMinutes <= 0) {
            return "Unavailable";
        }

        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;

        if (hours && minutes) {
            return `${hours}h ${minutes}m`;
        }

        if (hours) {
            return `${hours} hour${hours === 1 ? "" : "s"}`;
        }

        return `${minutes} mins`;
    }

    function isTimeInRange(time, startTime, endTime) {
        const currentTime = toMinutes(time);
        const start = toMinutes(startTime);
        const end = toMinutes(endTime);

        return currentTime >= start && currentTime < end;
    }

    function getLabIcon(label) {
        const normalized = label.toLowerCase();

        if (normalized.includes("bio")) return "biotech";
        if (normalized.includes("chem")) return "science";
        if (normalized.includes("phys")) return "precision_manufacturing";
        if (normalized.includes("computer") || normalized.includes("comp")) return "computer";
        if (normalized.includes("clean")) return "sanitizer";

        return "lab_profile";
    }

    function getSelectedLabOption(elements) {
        if (!elements.labSelect || !elements.labSelect.value) {
            return null;
        }

        return elements.labSelect.options[elements.labSelect.selectedIndex];
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

    function setSelectPlaceholder(selectElement, placeholderText) {
        if (!selectElement) {
            return;
        }

        selectElement.innerHTML = `<option value="" disabled selected>${placeholderText}</option>`;
    }

    function resetTimeSelectors(elements) {
        setSelectPlaceholder(elements.startTimeSelect, "Select a Seat First");
        setSelectPlaceholder(elements.endTimeSelect, "Select a Start Time First");
    }

    function getSelectedSeatNumber() {
        return selectedSeatButton?.dataset.seatNumber || "";
    }

    function getSelectedStartTime(elements) {
        return elements.startTimeSelect?.value || "";
    }

    function getSeatReservations(seatNumber) {
        return currentReservations
            .filter((reservation) => reservation.seatNumber.toString() === seatNumber.toString())
            .sort((first, second) => toMinutes(first.startTime) - toMinutes(second.startTime));
    }

    function getDisplayTimeSlots(selectedDate) {
        if (selectedDate !== formatToday()) {
            return [...TIME_SLOTS];
        }

        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();

        return TIME_SLOTS.filter((timeSlot) => toMinutes(timeSlot) > nowMinutes);
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

    function hasCurrentUserBooking(seatReservations) {
        return seatReservations.some((reservation) => reservation.userId?._id?.toString() === String(config.userId));
    }

    function getSeatCardCopy(seatReservations, isSelectable, hasMyBooking) {
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

        if (hasMyBooking) {
            return {
                status: seatReservations.length === 1 ? "Your booking" : "Has your booking",
                hint: isSelectable ? "Hover to inspect bookings" : "No remaining start times"
            };
        }

        return {
            status: isSelectable
                ? `${seatReservations.length} booking${seatReservations.length === 1 ? "" : "s"}`
                : "Fully booked",
            hint: "Hover to inspect bookings"
        };
    }

    function updateSelectionSummary(elements) {
        const selectedLab = getSelectedLabOption(elements);
        const dateText = elements.dateSelect?.selectedOptions?.[0]?.text || "Not selected";
        const seatNumber = getSelectedSeatNumber();
        const startTime = getSelectedStartTime(elements);
        const endTime = elements.endTimeSelect?.value || "";

        if (elements.summaryLab) {
            elements.summaryLab.textContent = selectedLab ? selectedLab.dataset.room : "Not selected";
        }

        if (elements.summaryDate) {
            elements.summaryDate.textContent = dateText;
        }

        if (elements.summarySeat) {
            elements.summarySeat.textContent = seatNumber ? `Seat ${seatNumber}` : "Not selected";
        }

        if (elements.summaryStart) {
            elements.summaryStart.textContent = startTime || "Not selected";
        }

        if (elements.summaryEnd) {
            elements.summaryEnd.textContent = endTime || "Not selected";
        }

        if (elements.summaryDuration) {
            elements.summaryDuration.textContent = getDurationLabel(startTime, endTime);
        }

        if (elements.selectedSeatChip) {
            elements.selectedSeatChip.textContent = seatNumber ? `Seat: ${seatNumber}` : "Seat: Not selected";
        }

        if (elements.selectedTimeChip) {
            elements.selectedTimeChip.textContent = startTime ? `Start: ${startTime}` : "Start: Not selected";
        }

        if (elements.reserveButton) {
            elements.reserveButton.disabled = !(selectedLab && elements.dateSelect?.value && seatNumber && startTime && endTime);
        }
    }

    function updateLabPresentation(elements) {
        const selectedOption = getSelectedLabOption(elements);
        const selectedDateText = elements.dateSelect?.selectedOptions?.[0]?.text || "No date selected";

        elements.labButtons.forEach((button) => {
            button.classList.toggle("is-active", selectedOption && button.dataset.labId === selectedOption.value);
        });

        if (!selectedOption) {
            elements.selectedLabName.textContent = "Select a laboratory";
            elements.selectedLabMeta.textContent = "Choose a room from the left to view capacity and availability details.";
            updateSelectionSummary(elements);
            return;
        }

        elements.selectedLabName.textContent = selectedOption.dataset.room;
        elements.selectedLabMeta.textContent = `${selectedOption.dataset.hall} | Capacity: ${selectedOption.dataset.capacity} seats | ${selectedDateText}`;
        updateSelectionSummary(elements);
    }

    function hideSeatHoverCard(elements) {
        if (!elements.seatHoverCard) {
            return;
        }

        elements.seatHoverCard.hidden = true;
        elements.seatHoverCard.innerHTML = "";
    }

    function resetSelectionState(elements) {
        if (selectedSeatButton) {
            selectedSeatButton.classList.remove("is-selected");
        }

        selectedSeatButton = null;
        resetTimeSelectors(elements);
        hideSeatHoverCard(elements);
    }

    function renderEmptyTimetable(elements, message) {
        currentReservations = [];
        currentDisplayTimeSlots = [];

        if (elements.timetable) {
            elements.timetable.innerHTML = `<div class="empty-state-cell">${message}</div>`;
        }

        resetSelectionState(elements);
        updateSelectionSummary(elements);
    }

    function getUserDisplayName(user) {
        if (!user) {
            return "";
        }

        return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }

    function getReservationOwnerLabel(reservation) {
        const isCurrentUser = reservation.userId?._id?.toString() === String(config.userId);
        const fallbackName = reservation.studentName || getUserDisplayName(reservation.userId) || "someone";

        if (config.isWalkInMode) {
            if (isCurrentUser) {
                return reservation.studentName
                    ? `Walk-in booking by you for ${reservation.studentName}`
                    : "Walk-in booking by you";
            }

            return reservation.studentName
                ? `Walk-in booking for ${reservation.studentName}`
                : `Walk-in booking by ${fallbackName}`;
        }

        if (reservation.userId?.type === "LabTech") {
            return "Walk-in booking";
        }

        if (reservation.isAnonymous && !isCurrentUser) {
            return "Anonymous booking";
        }

        if (isCurrentUser) {
            return reservation.isAnonymous ? "Your booking (anonymous)" : "Your booking";
        }

        return `Booked by ${fallbackName}`;
    }

    function buildSeatHoverCardMarkup(seatNumber) {
        const seatReservations = getSeatReservations(seatNumber);
        const selectableStartTimes = getSelectableStartTimes(seatNumber);
        const subtitle = seatReservations.length
            ? `${seatReservations.length} booking${seatReservations.length === 1 ? "" : "s"} for this date${selectableStartTimes.length ? " with remaining availability." : "."}`
            : "No bookings for this date.";

        if (!seatReservations.length) {
            return `
                <h4 class="seat-hover-card__title">Seat ${escapeHtml(seatNumber)}</h4>
                <p class="seat-hover-card__subtitle">${escapeHtml(subtitle)}</p>
            `;
        }

        const listItems = seatReservations.map((reservation) => `
            <li class="seat-hover-card__item">
                <span class="seat-hover-card__time">${escapeHtml(`${reservation.startTime} - ${reservation.endTime}`)}</span>
                <span class="seat-hover-card__meta">${escapeHtml(getReservationOwnerLabel(reservation))}</span>
            </li>
        `).join("");

        return `
            <h4 class="seat-hover-card__title">Seat ${escapeHtml(seatNumber)}</h4>
            <p class="seat-hover-card__subtitle">${escapeHtml(subtitle)}</p>
            <ul class="seat-hover-card__list">${listItems}</ul>
        `;
    }

    function positionSeatHoverCard(elements, button, event) {
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

    function showSeatHoverCard(elements, button, event) {
        if (!elements.seatHoverCard) {
            return;
        }

        elements.seatHoverCard.innerHTML = buildSeatHoverCardMarkup(button.dataset.seatNumber);
        elements.seatHoverCard.hidden = false;
        positionSeatHoverCard(elements, button, event);
    }

    function populateStartTimes(elements) {
        const seatNumber = getSelectedSeatNumber();

        setSelectPlaceholder(elements.startTimeSelect, seatNumber ? "Select a Start Time" : "Select a Seat First");
        setSelectPlaceholder(elements.endTimeSelect, "Select a Start Time First");

        if (!seatNumber) {
            updateSelectionSummary(elements);
            return;
        }

        const startTimes = getSelectableStartTimes(seatNumber);

        if (!startTimes.length) {
            setSelectPlaceholder(elements.startTimeSelect, "No Available Start Times");
            updateSelectionSummary(elements);
            return;
        }

        startTimes.forEach((timeSlot) => {
            const option = document.createElement("option");
            option.value = timeSlot;
            option.textContent = timeSlot;
            elements.startTimeSelect.appendChild(option);
        });

        updateSelectionSummary(elements);
    }

    function populateEndTimes(elements) {
        const seatNumber = getSelectedSeatNumber();
        const startTime = getSelectedStartTime(elements);

        setSelectPlaceholder(elements.endTimeSelect, startTime ? "Select an End Time" : "Select a Start Time First");

        if (!seatNumber || !startTime) {
            updateSelectionSummary(elements);
            return;
        }

        const endTimes = getValidEndTimes(seatNumber, startTime);

        if (!endTimes.length) {
            setSelectPlaceholder(elements.endTimeSelect, "No Available End Times");
            updateSelectionSummary(elements);
            return;
        }

        endTimes.forEach((timeSlot) => {
            const option = document.createElement("option");
            option.value = timeSlot;
            option.textContent = timeSlot;
            elements.endTimeSelect.appendChild(option);
        });

        updateSelectionSummary(elements);
    }

    function setSelectedSeat(elements, nextSeatButton) {
        const isSameSeat = selectedSeatButton === nextSeatButton;

        if (selectedSeatButton && !isSameSeat) {
            selectedSeatButton.classList.remove("is-selected");
        }

        selectedSeatButton = nextSeatButton;
        selectedSeatButton.classList.add("is-selected");

        if (!isSameSeat) {
            populateStartTimes(elements);
        }

        updateSelectionSummary(elements);
    }

    function handleSeatClick(elements, event) {
        const seatButton = event.currentTarget;

        if (seatButton.dataset.selectable !== "true") {
            seatButton.focus();
            return;
        }

        setSelectedSeat(elements, seatButton);
    }

    function renderSeatGrid(elements, capacity) {
        let seatGridMarkup = "";

        for (let seatNumber = 1; seatNumber <= capacity; seatNumber += 1) {
            const seatReservations = getSeatReservations(seatNumber);
            const selectableStartTimes = getSelectableStartTimes(seatNumber);
            const hasMyBooking = hasCurrentUserBooking(seatReservations);
            const isSelectable = selectableStartTimes.length > 0;
            const seatCopy = getSeatCardCopy(seatReservations, isSelectable, hasMyBooking);
            const classNames = ["seat-card"];

            if (isSelectable) {
                classNames.push("is-selectable");
            } else {
                classNames.push("is-unavailable");
            }

            if (seatReservations.length) {
                classNames.push("has-bookings");
            }

            if (hasMyBooking) {
                classNames.push("has-my-booking");
            }

            seatGridMarkup += `
                <button
                    type="button"
                    class="${classNames.join(" ")}"
                    data-seat-number="${seatNumber}"
                    data-selectable="${isSelectable ? "true" : "false"}"
                    aria-disabled="${isSelectable ? "false" : "true"}"
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
            button.addEventListener("click", handleSeatClick.bind(null, elements));
            button.addEventListener("mouseenter", showSeatHoverCard.bind(null, elements, button));
            button.addEventListener("mousemove", positionSeatHoverCard.bind(null, elements, button));
            button.addEventListener("mouseleave", hideSeatHoverCard.bind(null, elements));
            button.addEventListener("focus", showSeatHoverCard.bind(null, elements, button));
            button.addEventListener("blur", hideSeatHoverCard.bind(null, elements));
        });
    }

    function loadAvailability(elements) {
        const selectedLab = getSelectedLabOption(elements);
        const selectedDate = elements.dateSelect?.value || "";

        if (!selectedLab || !selectedDate) {
            alert("Please select a laboratory and date to view available seats.");
            return;
        }

        const capacity = parseInt(selectedLab.dataset.capacity, 10);

        if (!capacity) {
            renderEmptyTimetable(elements, "This laboratory does not have seat capacity configured yet.");
            return;
        }

        resetSelectionState(elements);
        availabilityLoaded = true;
        elements.chartHeader.textContent = "Seat map";
        currentDisplayTimeSlots = getDisplayTimeSlots(selectedDate);

        if (currentDisplayTimeSlots.length < 2) {
            renderEmptyTimetable(elements, "No remaining time ranges are available for today. Select another date.");
            return;
        }

        fetch(`/api/reservations/lab/${selectedLab.value}/date/${selectedDate}`)
            .then((response) => response.json())
            .then((data) => {
                currentReservations = data.reservations || [];
                renderSeatGrid(elements, capacity);
                updateSelectionSummary(elements);
            })
            .catch((error) => {
                console.error("Error fetching reservations:", error);
                renderEmptyTimetable(elements, "Unable to load availability right now. Please try again.");
            });
    }

    function openPopup(elements) {
        if (!selectedSeatButton) {
            alert("Please select a seat first.");
            return;
        }

        if (!elements.startTimeSelect?.value) {
            alert("Please select a start time.");
            return;
        }

        if (!elements.endTimeSelect?.value) {
            alert("Please select an end time.");
            return;
        }

        elements.confirmPopup?.classList.add("open-popup");

        if (elements.overlay) {
            elements.overlay.style.display = "block";
        }
    }

    function hideConfirmPopup(elements) {
        elements.confirmPopup?.classList.remove("open-popup");

        if (elements.overlay) {
            elements.overlay.style.display = "none";
        }
    }

    function submitReservation(elements) {
        const selectedLab = getSelectedLabOption(elements);
        const date = elements.dateSelect?.value || "";
        const seatNumber = getSelectedSeatNumber();
        const startTime = getSelectedStartTime(elements);
        const endTime = elements.endTimeSelect?.value || "";
        const anonymousInput = document.getElementById("anonymous");
        const isAnonymous = anonymousInput ? anonymousInput.checked : false;

        if (!selectedLab || !date || !seatNumber || !startTime || !endTime) {
            alert(config.missingSelectionMessage || "Please complete the reservation details first.");
            hideConfirmPopup(elements);
            return;
        }

        fetch(`/api/reservations/check-availability?labId=${selectedLab.value}&date=${date}&seatNumber=${seatNumber}&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`)
            .then((response) => response.json())
            .then((data) => {
                if (!data.available) {
                    hideConfirmPopup(elements);
                    alert(data.message || "This seat is no longer available. Please choose another slot.");
                    return;
                }

                document.getElementById("labId").value = selectedLab.value;
                document.getElementById("date").value = date;
                document.getElementById("seatNumber").value = seatNumber;
                document.getElementById("startTime").value = startTime;
                document.getElementById("endTime").value = endTime;
                document.getElementById("isAnonymous").value = isAnonymous;
                document.getElementById("reservationForm").submit();
            })
            .catch((error) => {
                console.error("Error checking seat availability:", error);
                alert("Failed to check seat availability. Please try again.");
                hideConfirmPopup(elements);
            });
    }

    function init() {
        const elements = getElements();

        if (!elements.labSelect || !elements.dateSelect) {
            return;
        }

        elements.labButtons.forEach((button) => {
            const icon = button.querySelector(".lab-option__icon");

            if (icon) {
                icon.textContent = getLabIcon(`${button.dataset.room || ""} ${button.dataset.hall || ""}`);
            }

            button.addEventListener("click", function() {
                elements.labSelect.value = button.dataset.labId;
                updateLabPresentation(elements);

                if (availabilityLoaded) {
                    loadAvailability(elements);
                }
            });
        });

        updateLabPresentation(elements);
        renderEmptyTimetable(elements, "Choose a laboratory and load availability to begin.");

        if (!elements.labButtons.length) {
            elements.viewButton.disabled = true;
        } else {
            loadAvailability(elements);
        }

        elements.labSelect.addEventListener("change", function() {
            updateLabPresentation(elements);

            if (availabilityLoaded) {
                loadAvailability(elements);
            }
        });

        elements.dateSelect.addEventListener("change", function() {
            updateLabPresentation(elements);
            resetSelectionState(elements);
            updateSelectionSummary(elements);

            if (availabilityLoaded) {
                loadAvailability(elements);
            }
        });

        elements.viewButton?.addEventListener("click", loadAvailability.bind(null, elements));
        elements.startTimeSelect?.addEventListener("change", populateEndTimes.bind(null, elements));
        elements.endTimeSelect?.addEventListener("change", updateSelectionSummary.bind(null, elements));
        elements.reserveButton?.addEventListener("click", openPopup.bind(null, elements));
        elements.confirmCancel?.addEventListener("click", hideConfirmPopup.bind(null, elements));
        elements.confirmSubmit?.addEventListener("click", submitReservation.bind(null, elements));
        window.addEventListener("scroll", hideSeatHoverCard.bind(null, elements), true);
        window.addEventListener("resize", hideSeatHoverCard.bind(null, elements));

        if (new URLSearchParams(window.location.search).get("success")) {
            window.scrollTo({ top: 0, behavior: "smooth" });
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
