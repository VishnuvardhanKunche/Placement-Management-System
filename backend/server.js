require("dotenv").config();

const { validateEnv } = require("./src/config/env");
validateEnv(); // Fail-fast environment check

const app = require("./src/app");
const pool = require("./src/config/db");
const { logger } = require("./src/config/logger");

const PORT = process.env.PORT || 5000;

let server;

async function startServer(){
    try {
        await pool.query("SELECT NOW()");
        console.log("✅ Connected to PostgreSQL");
        logger.info("Connected to PostgreSQL successfully");

        server = app.listen(PORT, () => {
            console.log(`🚀 Server started at http://localhost:${PORT}`);
            logger.info(`Server started at http://localhost:${PORT}`);
        });
    } catch(error) {
        console.error("❌ Failed to connect to PostgreSQL:", error.message);
        logger.error("Failed to connect to PostgreSQL", error);
        process.exit(1);
    }
}

function gracefulShutdown(signal) {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);

    if (server) {
        server.close((err) => {
            if (err) {
                logger.error("Error closing Express server", err);
                process.exit(1);
            }

            logger.info("Express server closed.");

            pool.end()
                .then(() => {
                logger.info("PostgreSQL database pool closed.");
                logger.info("Graceful shutdown finished. Exiting process.");
                process.exit(0);
            })
            .catch((err) => {
                logger.error("Error closing PostgreSQL pool during shutdown", err);
                process.exit(1);
            });
        });
    } else {
        process.exit(0);
    }
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

startServer();

