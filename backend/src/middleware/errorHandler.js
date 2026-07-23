const { logger } = require("../config/logger");

function errorHandler(err, req, res, next) {
    const statusCode = err.statusCode || 500;
    const message = err.message || "Internal server error";

    // Log error via Winston
    logger.error({
        message: `${req.method} ${req.originalUrl} - Status: ${statusCode} - Error: ${message}`,
        status: statusCode,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        stack: err.stack,
    });

    res.status(statusCode).json({
        success: false,
        message,
    });
}

module.exports = errorHandler;
