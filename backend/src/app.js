const express = require("express");
const path = require("path");
const helmet = require("helmet");
const cors = require("cors");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const morgan = require("morgan");

const pool = require("./config/db");
const { morganStream } = require("./config/logger");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(compression());

app.use(
    morgan(":method :url :status :res[content-length] - :response-time ms", {
        stream: morganStream,
    })
);

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        message: "Too many requests from this IP, please try again after 15 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api/", limiter);

const departmentRoutes = require("./routes/department.routes");
const authRoutes = require("./routes/auth.routes");
const companyRoutes = require("./routes/company.routes");
const coordinatorRoutes = require("./routes/coordinator.routes");
const studentRoutes = require("./routes/student.routes");
const driveRoutes = require("./routes/drive.routes");
const applicationRoutes = require("./routes/application.routes");
const offerRoutes = require("./routes/offer.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const resumeRoutes = require("./routes/resume.routes");
const notificationRoutes = require("./routes/notification.routes");
const reportRoutes = require("./routes/report.routes");

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check endpoint
app.get("/health", async (req, res) => {
    let dbStatus = "Connected";
    try {
        await pool.query("SELECT 1");
    } catch (err) {
        dbStatus = "Disconnected";
    }

    res.status(dbStatus === "Connected" ? 200 : 500).json({
        success: dbStatus === "Connected",
        status: dbStatus === "Connected" ? "UP" : "DOWN",
        uptime: process.uptime(),
        database: dbStatus,
        timestamp: new Date().toISOString(),
    });
});

app.use("/api/departments", departmentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/coordinators", coordinatorRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/drives", driveRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);

// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: "Endpoint not found",
    });
});

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;