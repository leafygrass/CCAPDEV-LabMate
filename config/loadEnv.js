const fs = require("fs");
const path = require("path");

const ENV_PATH = path.join(__dirname, "..", ".env");

function normalizeEnvValue(value) {
    if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
    ) {
        return value.slice(1, -1);
    }

    return value;
}

function loadEnvFile(envPath = ENV_PATH) {
    if (!fs.existsSync(envPath)) {
        return;
    }

    const fileContents = fs.readFileSync(envPath, "utf8");

    for (const rawLine of fileContents.split(/\r?\n/)) {
        const line = rawLine.trim();

        if (!line || line.startsWith("#")) {
            continue;
        }

        const separatorIndex = line.indexOf("=");

        if (separatorIndex <= 0) {
            continue;
        }

        const key = line.slice(0, separatorIndex).trim();

        if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
            continue;
        }

        const value = normalizeEnvValue(line.slice(separatorIndex + 1).trim());
        process.env[key] = value;
    }
}

loadEnvFile();

module.exports = {
    ENV_PATH,
    loadEnvFile
};
