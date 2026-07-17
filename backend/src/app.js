const express = require("express");

const app = express();

const departmentRoutes = require("./routes/department.routes");
const authRoutes = require("./routes/auth.routes");
const companyRoutes = require("./routes/company.routes");
const coordinatorRoutes = require("./routes/coordinator.routes");
const studentRoutes = require("./routes/student.routes");

app.use(express.json());

app.use("/api/departments", departmentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/coordinators", coordinatorRoutes);
app.use("/api/students", studentRoutes);

module.exports = app;