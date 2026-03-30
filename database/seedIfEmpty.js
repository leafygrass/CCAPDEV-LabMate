require("../config/loadEnv");

const { seedDatabaseIfEmpty } = require("./seedDatabase");

seedDatabaseIfEmpty()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
