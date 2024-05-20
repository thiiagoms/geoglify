function logInfo(message) {
    console.info(`\x1b[33m[${new Date().toLocaleString( { timeZone: "UTC" })}]\x1b[0m ${message}`);
}

function logError(message) {
    console.error(`\x1b[31m[${new Date().toLocaleString( { timeZone: "UTC" })}]\x1b[0m ${message}`);
}

function logSuccess(message) {
    console.info(`\x1b[32m[${new Date().toLocaleString( { timeZone: "UTC" })}]\x1b[0m ${message}`);
}

function logWarning(message) {
    console.info(`\x1b[90m[${new Date().toLocaleString( { timeZone: "UTC" })}]\x1b[0m ${message}`);
}

module.exports = { logInfo, logError, logSuccess, logWarning };