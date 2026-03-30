const express = require("express");
const fileUpload = require("express-fileupload");
const path = require("path");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const mongodbsesh = require("connect-mongodb-session")(session);

const User = require("./database/models/User");
const Laboratory = require("./database/models/Laboratory");
const { DATABASE_URI } = require("./config/pageConfigs");
const { logSessionState } = require("./middleware/sessionLogger");
const { deletePastReservations } = require("./services/reservationService");
const { startReservationCleanupJob } = require("./jobs/reservationCleanup");

const publicRouter = require("./routes/public");
const studentRouter = require("./routes/student");
const labtechRouter = require("./routes/labtech");
const userApiRouter = require("./routes/api/users");
const reservationApiRouter = require("./routes/api/reservations");
const laboratoryApiRouter = require("./routes/api/laboratories");

const app = express();

app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "views"));
app.engine("hbs", exphbs.engine({
    extname: "hbs",
    helpers: {
        eq: (a, b) => a === b
    }
}));

mongoose.connect(process.env.DATABASE_URL || DATABASE_URI)
    .then(async () => {
        console.log("Connected to MongoDB successfully");

        const userCount = await User.countDocuments();
        const labCount = await Laboratory.countDocuments();

        if (userCount === 0 && labCount === 0) {
            console.log("Database is empty. Seeding database...");
            await require("./database/seedDatabase");
        } else {
            console.log(`Database currently has ${userCount} users & ${labCount} laboratories.`);
        }
    })
    .catch((err) => {
        console.error("MongoDB connection error:", err);
    });

const store = new mongodbsesh({
    uri: process.env.DATABASE_URL || DATABASE_URI,
    collection: "sessions"
});

store.on("error", (error) => {
    console.error("Session store error:", error);
});

app.use(cookieParser());
app.use(session({
    secret: "secret-key-shhhh",
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: null
    },
    store
}));

app.use(logSessionState);

app.use(publicRouter);
app.use(studentRouter);
app.use(labtechRouter);
app.use(userApiRouter);
app.use(reservationApiRouter);
app.use(laboratoryApiRouter);

startReservationCleanupJob(deletePastReservations);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
