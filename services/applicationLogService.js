const MAX_LOG_ENTRIES = 1000;

const applicationLogs = [];

function addApplicationLog({ actorName, actorType, action, target = "N/A", metadata = "" }) {
    applicationLogs.unshift({
        timestamp: new Date().toISOString(),
        actorName: actorName || "System",
        actorType: actorType || "System",
        action,
        target,
        metadata
    });

    if (applicationLogs.length > MAX_LOG_ENTRIES) {
        applicationLogs.length = MAX_LOG_ENTRIES;
    }
}

function getApplicationLogs() {
    return applicationLogs;
}

module.exports = {
    addApplicationLog,
    getApplicationLogs
};
