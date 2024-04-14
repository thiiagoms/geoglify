const { connectToMongoDBWithRetry } = require("./mongodb");
const { server } = require("./express");
const { logSuccess, logError } = require("./utils");

connectToMongoDBWithRetry()
  .then(() => {
    server.listen(8081, () => {
      logSuccess("Server running on port 8081");
    });
  })
  .catch(() => {
    logError("Failed to connect to MongoDB");
  });
