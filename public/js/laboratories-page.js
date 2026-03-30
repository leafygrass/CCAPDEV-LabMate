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
    const seatClassNames = ["clickable-seat", "selected-seat", "taken-seat", "my-booking-seat"];

    let selectedSeatButton = null;
    let availabilityLoaded = false;

    function getElements() {
        return {
            labSelect: document.getElementById("labs"),
            dateSelect: document.getElementById("dates"),
            endTimeSelect: document.getElementById("endtimes"),
            labButtons: Array.from(document.querySelectorAll(".lab-option")),
            viewButton: document.getElementById("view-button"),
            reserveButton: document.getElementById("reserve-button"),
            timetable: document.getElementById("timetable"),
            slotChartHead: document.getElementById("slot-chart-head"),
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
            return "Select a seat and end time";
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

    function setButtonClass(button, className) {
        button.classList.remove(...seatClassNames);
        button.classList.add(className);
    }

    function updateSelectionSummary(elements) {
        const selectedLab = getSelectedLabOption(elements);
        const dateText = elements.dateSelect?.selectedOptions?.[0]?.text || "Not selected";
        const seatNumber = selectedSeatButton?.getAttribute("seat-number");
        const startTime = selectedSeatButton?.getAttribute("seat-time");
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
            elements.reserveButton.disabled = !(selectedLab && elements.dateSelect?.value && selectedSeatButton && endTime);
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

    function resetSelectionState(elements) {
        selectedSeatButton = null;

        if (elements.endTimeSelect) {
            elements.endTimeSelect.innerHTML = '<option value="" disabled selected>Select an End Time</option>';
        }

        elements.timetable?.querySelectorAll(".selected-seat").forEach((button) => {
            setButtonClass(button, "clickable-seat");
        });
    }

    function renderEmptyTimetable(elements, message) {
        if (elements.slotChartHead) {
            elements.slotChartHead.innerHTML = "";
        }

        if (elements.timetable) {
            elements.timetable.innerHTML = `<tr><td class="empty-state-cell">${message}</td></tr>`;
        }

        resetSelectionState(elements);
        updateSelectionSummary(elements);
    }

    function applyRangeSelection(elements) {
        elements.timetable?.querySelectorAll(".selected-seat").forEach((button) => {
            setButtonClass(button, "clickable-seat");
        });

        if (!selectedSeatButton) {
            updateSelectionSummary(elements);
            return;
        }

        const seatNumber = selectedSeatButton.getAttribute("seat-number");
        const startTime = selectedSeatButton.getAttribute("seat-time");
        const selectedEndTime = elements.endTimeSelect?.value || "";
        const startIndex = TIME_SLOTS.indexOf(startTime);
        const endIndex = TIME_SLOTS.indexOf(selectedEndTime);

        if (!selectedEndTime || startIndex === -1 || endIndex === -1) {
            setButtonClass(selectedSeatButton, "selected-seat");
            updateSelectionSummary(elements);
            return;
        }

        elements.timetable?.querySelectorAll(`[seat-number="${seatNumber}"]`).forEach((button) => {
            const seatIndex = TIME_SLOTS.indexOf(button.getAttribute("seat-time"));
            if (seatIndex >= startIndex && seatIndex < endIndex) {
                setButtonClass(button, "selected-seat");
            }
        });

        updateSelectionSummary(elements);
    }

    function createNameElement(text) {
        const nameSpan = document.createElement("span");
        nameSpan.className = "user-name";
        nameSpan.textContent = text;
        return nameSpan;
    }

    function createReservationPopups(reservations) {
        document.querySelectorAll(".popup2").forEach((popup) => popup.remove());

        reservations.forEach((reservation, index) => {
            const isCurrentUser = reservation.userId?._id?.toString() === String(config.userId);
            const popupDiv = document.createElement("div");
            const popupBox = document.createElement("div");
            const timeSpan = document.createElement("span");

            popupDiv.className = "popup2";
            popupDiv.id = `popup-frame-${index}`;
            popupBox.className = "popup-box";
            timeSpan.className = "popup-header";
            timeSpan.textContent = `${reservation.startTime} - ${reservation.endTime}`;
            popupBox.appendChild(timeSpan);

            if (config.isWalkInMode) {
                const userImg = document.createElement("img");
                userImg.className = "user-img";
                userImg.src = reservation.userId?.image || "/img/default-profile.png";
                userImg.alt = reservation.studentName || "Reservation profile";
                userImg.onclick = function(event) {
                    event.stopPropagation();
                    if (typeof window.openProfileModal === "function") {
                        window.openProfileModal(reservation.userId?._id);
                    }
                };

                popupBox.appendChild(userImg);
                popupBox.appendChild(createNameElement(
                    reservation.userId?.type === "LabTech" && !isCurrentUser
                        ? `For Walk-in (by ${reservation.studentName})`
                        : (isCurrentUser ? "For Walk-in (by You)" : reservation.studentName)
                ));
            } else if (reservation.isAnonymous && !isCurrentUser) {
                popupBox.appendChild(createNameElement("Anonymous Student"));
            } else if (reservation.userId?.type === "LabTech") {
                popupBox.appendChild(createNameElement("Walk-in Student"));
            } else {
                const userImg = document.createElement("img");
                userImg.className = "user-img";
                userImg.src = reservation.userId?.image || "/img/default-profile.png";
                userImg.alt = reservation.studentName || "Reservation profile";
                userImg.onclick = function(event) {
                    event.stopPropagation();
                    if (typeof window.openProfileModal === "function") {
                        window.openProfileModal(reservation.userId?._id);
                    }
                };

                popupBox.appendChild(userImg);
                popupBox.appendChild(createNameElement(
                    isCurrentUser
                        ? `Your Reservation${reservation.isAnonymous ? " (Anonymous)" : ""}`
                        : reservation.studentName
                ));
            }

            popupDiv.appendChild(popupBox);
            document.body.appendChild(popupDiv);
        });
    }

    function togglePopup(popupId) {
        document.querySelectorAll(".popup2").forEach((popup) => {
            if (popup.id !== popupId) {
                popup.classList.remove("show");
            }
        });

        const popup = document.getElementById(popupId);
        if (popup) {
            popup.classList.toggle("show");
        }
    }

    function generateValidEndTimes(elements, selectedSeat) {
        const seatNumber = selectedSeat.getAttribute("seat-number");
        const seatTime = selectedSeat.getAttribute("seat-time");
        const selectedLab = getSelectedLabOption(elements);
        const selectedDate = elements.dateSelect?.value || "";
        const startIndex = TIME_SLOTS.indexOf(seatTime);

        elements.endTimeSelect.innerHTML = '<option value="" disabled selected>Select an End Time</option>';

        if (!selectedLab || !selectedDate || startIndex === -1) {
            updateSelectionSummary(elements);
            return;
        }

        fetch(`/api/reservations/lab/${selectedLab.value}/date/${selectedDate}`)
            .then((response) => response.json())
            .then((data) => {
                let nextReservationIndex = TIME_SLOTS.length;

                if (data.reservations?.length) {
                    const seatReservations = data.reservations.filter((reservation) =>
                        reservation.seatNumber.toString() === seatNumber.toString() &&
                        TIME_SLOTS.indexOf(reservation.startTime) > startIndex
                    );

                    if (seatReservations.length > 0) {
                        const earliestNextReservation = seatReservations.reduce((earliest, current) => {
                            const earliestIndex = TIME_SLOTS.indexOf(earliest.startTime);
                            const currentIndex = TIME_SLOTS.indexOf(current.startTime);
                            return currentIndex < earliestIndex ? current : earliest;
                        });

                        nextReservationIndex = TIME_SLOTS.indexOf(earliestNextReservation.startTime);
                    }
                }

                for (let index = startIndex + 1; index <= nextReservationIndex; index += 1) {
                    if (index < TIME_SLOTS.length) {
                        const option = document.createElement("option");
                        option.value = TIME_SLOTS[index];
                        option.textContent = TIME_SLOTS[index];
                        elements.endTimeSelect.appendChild(option);
                    }
                }

                if (elements.endTimeSelect.options.length === 1) {
                    const option = document.createElement("option");
                    option.value = "";
                    option.textContent = "No available end times";
                    option.disabled = true;
                    elements.endTimeSelect.appendChild(option);
                }

                updateSelectionSummary(elements);
            })
            .catch((error) => {
                console.error("Error fetching reservations:", error);
            });
    }

    function handleSeatClick(elements, event) {
        selectedSeatButton = event.currentTarget;
        if (elements.endTimeSelect) {
            elements.endTimeSelect.selectedIndex = 0;
        }
        generateValidEndTimes(elements, selectedSeatButton);
        applyRangeSelection(elements);
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
        elements.chartHeader.textContent = "Time-by-seat grid";

        let displayTimeSlots = [...TIME_SLOTS];

        if (selectedDate === formatToday()) {
            const now = new Date();
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            displayTimeSlots = TIME_SLOTS.filter((timeSlot) => toMinutes(timeSlot) > nowMinutes);

            if (!displayTimeSlots.length) {
                renderEmptyTimetable(elements, "No remaining time slots are available for today. Select another date.");
                return;
            }
        }

        fetch(`/api/reservations/lab/${selectedLab.value}/date/${selectedDate}`)
            .then((response) => response.json())
            .then((data) => {
                const reservations = data.reservations || [];

                createReservationPopups(reservations);
                elements.slotChartHead.innerHTML = `<th id="seat-header">Seat</th>${displayTimeSlots.map((time) => `<th>${time}</th>`).join("")}`;

                let timetableHTML = "";

                for (let seat = 1; seat <= capacity; seat += 1) {
                    timetableHTML += `<tr><td class="freezecol">Seat ${seat}</td>`;

                    displayTimeSlots.forEach((time) => {
                        const matchingReservation = reservations.find((reservation) =>
                            reservation.seatNumber === seat && isTimeInRange(time, reservation.startTime, reservation.endTime)
                        );

                        let seatClass = "clickable-seat";
                        let popupId = "";

                        if (matchingReservation) {
                            const reservationIndex = reservations.findIndex((reservation) =>
                                reservation._id === matchingReservation._id ||
                                (
                                    reservation.seatNumber === matchingReservation.seatNumber &&
                                    reservation.startTime === matchingReservation.startTime &&
                                    reservation.userId?._id === matchingReservation.userId?._id
                                )
                            );

                            popupId = `popup-frame-${reservationIndex}`;
                            seatClass = matchingReservation.userId?._id?.toString() === String(config.userId)
                                ? "my-booking-seat"
                                : "taken-seat";
                        }

                        timetableHTML += `
                            <td>
                                <button
                                    type="button"
                                    class="${seatClass}"
                                    seat-number="${seat}"
                                    seat-time="${time}"
                                    data-popup-id="${popupId}"
                                    aria-label="Seat ${seat} at ${time}"
                                    title="Seat ${seat} at ${time}"
                                ></button>
                            </td>
                        `;
                    });

                    timetableHTML += "</tr>";
                }

                elements.timetable.innerHTML = timetableHTML;

                document.querySelectorAll(".clickable-seat").forEach((button) => {
                    button.addEventListener("click", handleSeatClick.bind(null, elements));
                });

                document.querySelectorAll(".taken-seat, .my-booking-seat").forEach((button) => {
                    button.addEventListener("click", function() {
                        const popupId = button.getAttribute("data-popup-id");
                        if (popupId) {
                            togglePopup(popupId);
                        }
                    });
                });

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
        const endTime = elements.endTimeSelect?.value || "";
        const seatNumber = selectedSeatButton?.getAttribute("seat-number");
        const startTime = selectedSeatButton?.getAttribute("seat-time");
        const anonymousInput = document.getElementById("anonymous");
        const isAnonymous = anonymousInput ? anonymousInput.checked : false;

        if (!selectedLab || !date || !endTime || !seatNumber || !startTime) {
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

    function closeReservationPopupOnOutsideClick(event) {
        const activePopup = document.querySelector(".popup2.show");

        if (!activePopup) {
            return;
        }

        const clickedReservedSeat = event.target.closest(".taken-seat, .my-booking-seat");
        const clickedPopup = event.target.closest(".popup2");
        const clickedProfileModal = event.target.closest("#profile-modal");

        if (!clickedReservedSeat && !clickedPopup && !clickedProfileModal) {
            activePopup.classList.remove("show");
        }
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
        elements.endTimeSelect?.addEventListener("change", applyRangeSelection.bind(null, elements));
        elements.reserveButton?.addEventListener("click", openPopup.bind(null, elements));
        elements.confirmCancel?.addEventListener("click", hideConfirmPopup.bind(null, elements));
        elements.confirmSubmit?.addEventListener("click", submitReservation.bind(null, elements));
        document.addEventListener("click", closeReservationPopupOnOutsideClick);

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
