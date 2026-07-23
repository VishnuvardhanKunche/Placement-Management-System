const winston = require("winston");
const path = require("path");

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

const logger = winston.createLogger({
    level: process.env.NODE_ENV === "development" ? "debug" : "info",
    format: logFormat,
    transports: [
        new winston.transports.File({
            filename: path.join(__dirname, "../../logs/error.log"),
            level: "error",
        }),
        new winston.transports.File({
            filename: path.join(__dirname, "../../logs/combined.log"),
        }),
    ],
});

// If in development mode, log to console with simple colorized formatting as well
if (process.env.NODE_ENV !== "production") {
    logger.add(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            ),
        })
    );
}

// Stream for Morgan HTTP logging integration
const morganStream = {
    write: (message) => {
        logger.info(message.trim());
    },
};

module.exports = {
    logger,
    morganStream,
};
