# JavaScript Documentation

Generated on 2026-03-30.

This codebase currently has no named `class` declarations. The lists below cover the named functions found in each `.js` file.

## Config

| File | Functions |
| --- | --- |
| `config/loadEnv.js` | `loadEnvFile`, `normalizeEnvValue` |
| `config/pageConfigs.js` | None |

## Database

| File | Functions |
| --- | --- |
| `database/adminAccount.js` | `ensureAdminAccount`, `getDefaultAdminSeed` |
| `database/models/Laboratory.js` | None |
| `database/models/Reservation.js` | None |
| `database/models/TimeSlotOptions.js` | None |
| `database/models/User.js` | None |
| `database/seedData.js` | None |
| `database/seedDatabase.js` | `hashSeedUsers`, `seedDatabase`, `seedDatabaseIfEmpty` |
| `database/seedIfEmpty.js` | None |
| `database/seedReservations.js` | `generateEndTime`, `seedReservations` |

## Jobs

| File | Functions |
| --- | --- |
| `jobs/reservationCleanup.js` | `startReservationCleanupJob` |

## Middleware

| File | Functions |
| --- | --- |
| `middleware/auth.js` | `createRoleGuard`, `isAuth` |
| `middleware/sessionLogger.js` | `logSessionState` |

## Public Scripts

| File | Functions |
| --- | --- |
| `public/js/laboratories-page.js` | `buildSeatHoverCardMarkup`, `escapeHtml`, `formatToday`, `getDisplayTimeSlots`, `getDurationLabel`, `getElements`, `getLabIcon`, `getReservationOwnerLabel`, `getSeatCardCopy`, `getSeatReservations`, `getSelectableStartTimes`, `getSelectedLabOption`, `getSelectedSeatNumber`, `getSelectedStartTime`, `getUserDisplayName`, `getValidEndTimes`, `handleSeatClick`, `hasCurrentUserBooking`, `hideConfirmPopup`, `hideSeatHoverCard`, `init`, `isTimeInRange`, `loadAvailability`, `openPopup`, `populateEndTimes`, `populateStartTimes`, `positionSeatHoverCard`, `renderEmptyTimetable`, `renderSeatGrid`, `resetSelectionState`, `resetTimeSelectors`, `setSelectedSeat`, `setSelectPlaceholder`, `showSeatHoverCard`, `submitReservation`, `toMinutes`, `updateLabPresentation`, `updateSelectionSummary` |
| `public/js/profile-modal.js` | `closeProfileModal`, `hideReservationPopups`, `openProfileModal` |
| `public/js/reservations-page.js` | `bindEventHandlers`, `cancelEditing`, `closeDetailsPopup`, `closePopup`, `confirmRemoval`, `createEndTimeSelect`, `deleteReservation`, `fetchJson`, `findNextReservationIndex`, `formatApiDate`, `formatDisplayDate`, `formatTimeOfDay`, `getSelectedReservationId`, `isEditingReservation`, `loadReservationDetails`, `openDetailsPopup`, `openPopup`, `openRemovePopup`, `restoreEndTimeField`, `saveChanges`, `startEditing`, `syncActionButtons` |
| `public/js/seat-manager.js` | `handleReservation`, `handleSeatClick`, `initializeSeats`, `populateDates`, `setupAnonymousOption`, `setupEventListeners`, `updateEndTimeOptions`, `updateSeatColor`, `updateSeatStatus` |
| `public/js/signedout-laboratories.js` | `buildSeatHoverCardMarkup`, `escapeHtml`, `formatToday`, `getDisplayTimeSlots`, `getReservationOwnerLabel`, `getSeatCardCopy`, `getSeatReservations`, `getSelectableStartTimes`, `getSelectedLabOption`, `getValidEndTimes`, `hideSeatHoverCard`, `initializeDefaultSelections`, `isTimeInRange`, `loadAvailability`, `positionSeatHoverCard`, `renderEmptyState`, `renderSeatGrid`, `showSeatHoverCard`, `toMinutes`, `updateChartCopy` |

## Root

| File | Functions |
| --- | --- |
| `index.js` | None |

## Routes

| File | Functions |
| --- | --- |
| `routes/admin.js` | `buildAdminActor`, `buildRedirect` |
| `routes/api/laboratories.js` | None |
| `routes/api/reservations.js` | None |
| `routes/api/users.js` | None |
| `routes/labtech.js` | None |
| `routes/public.js` | None |
| `routes/student.js` | None |

## Services

| File | Functions |
| --- | --- |
| `services/applicationLogService.js` | `addApplicationLog`, `getApplicationLogs` |
| `services/pageService.js` | `createProfileSectionRedirectHandler`, `getProfileSectionHash`, `renderHomePage`, `renderLaboratoryPage`, `renderProfilePage`, `renderReservationsPage` |
| `services/reservationService.js` | `buildNext7Days`, `createReservationAndRedirect`, `deletePastReservations`, `formatProfileReservation`, `formatReservationDate`, `formatReservationsForList`, `getLaboratoryPageData`, `getRemovableReservationIds`, `getSortedReservations`, `getUpcomingLabSummary`, `normalizeReservationDate`, `sortReservationsBySchedule` |
| `services/sessionService.js` | `createGuestOnlyPageHandler`, `destroySession`, `getHomePathByType`, `redirectToUserHome`, `refreshSessionUser` |
| `services/userService.js` | `buildBasicUserData`, `buildDetailedUserData`, `deleteUserAccount`, `findUserById`, `formatRoleLabel`, `updateUserPassword`, `updateUserProfile` |

## Utils

| File | Functions |
| --- | --- |
| `utils/time.js` | `convertTimeToMinutes`, `convertTo24Hour`, `convertToHour`, `getReservationDateTime`, `getStatus`, `timeToNumber` |
