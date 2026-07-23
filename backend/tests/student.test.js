const request = require("supertest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const pool = require("../src/config/db");

describe("Student Management Tests", () => {
    let hashedPassword;
    let deptId;
    let coordToken;
    let coordId;
    let studentId;
    let studentToken;

    beforeAll(async () => {
        hashedPassword = await bcrypt.hash("password123", 10);
    });

    beforeEach(async () => {
        // 1. Insert Department
        const deptRes = await pool.query(
            "INSERT INTO departments (code, name, hod_name) VALUES ($1, $2, $3) RETURNING id",
            ["CSE", "Computer Science", "Dr. Suresh"]
        );
        deptId = deptRes.rows[0].id;

        // 2. Insert Coordinator User & Profile
        const coordUser = await pool.query(
            "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id",
            ["coord@college.edu", hashedPassword, "department_coordinator"]
        );
        coordId = coordUser.rows[0].id;

        await pool.query(
            "INSERT INTO department_coordinators (user_id, department_id, full_name, phone) VALUES ($1, $2, $3, $4)",
            [coordId, deptId, "Coordinator Name", "1234567890"]
        );

        coordToken = jwt.sign(
            { id: coordId, role: "department_coordinator" },
            process.env.JWT_SECRET || "test_jwt_secret_key_2026",
            { expiresIn: "24h" }
        );
    });

    describe("POST /api/students", () => {
        it("should allow a coordinator to create a student in their department", async () => {
            const res = await request(app)
                .post("/api/students")
                .set("Authorization", `Bearer ${coordToken}`)
                .send({
                    email: "student@example.com",
                    password: "password123",
                    roll_number: "ROLL100",
                    full_name: "Alice Student",
                    department_id: deptId,
                    phone: "9876543210",
                    cgpa: 8.50,
                    backlogs: 0,
                    graduation_year: 2027,
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty("student");
            expect(res.body.student).toHaveProperty("user_id");
            expect(res.body.student).toHaveProperty("roll_number", "ROLL100");
        });

        it("should reject duplicate roll numbers", async () => {
            await request(app)
                .post("/api/students")
                .set("Authorization", `Bearer ${coordToken}`)
                .send({
                    email: "student1@example.com",
                    password: "password123",
                    roll_number: "ROLL_DUP",
                    full_name: "Student One",
                    department_id: deptId,
                    cgpa: 8.50,
                    backlogs: 0,
                    graduation_year: 2027,
                });

            const res = await request(app)
                .post("/api/students")
                .set("Authorization", `Bearer ${coordToken}`)
                .send({
                    email: "student2@example.com",
                    password: "password123",
                    roll_number: "ROLL_DUP",
                    full_name: "Student Two",
                    department_id: deptId,
                    cgpa: 8.50,
                    backlogs: 0,
                    graduation_year: 2027,
                });

            expect(res.statusCode).toBe(409);
        });

        it("should reject student creation with invalid graduation year", async () => {
            const res = await request(app)
                .post("/api/students")
                .set("Authorization", `Bearer ${coordToken}`)
                .send({
                    email: "student3@example.com",
                    password: "password123",
                    roll_number: "ROLL200",
                    full_name: "Invalid Grad",
                    department_id: deptId,
                    graduation_year: "invalid_year",
                });

            expect(res.statusCode).toBe(400);
        });
    });

    describe("GET /api/students and Operations", () => {
        beforeEach(async () => {
            const studUser = await pool.query(
                "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id",
                ["alice@example.com", hashedPassword, "student"]
            );
            studentId = studUser.rows[0].id;
            await pool.query(
                "INSERT INTO students (user_id, roll_number, full_name, department_id, phone, cgpa, backlogs, graduation_year) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
                [studentId, "ROLL101", "Alice Student", deptId, "9876543210", 8.50, 0, 2027]
            );

            studentToken = jwt.sign(
                { id: studentId, role: "student" },
                process.env.JWT_SECRET || "test_jwt_secret_key_2026",
                { expiresIn: "24h" }
            );
        });

        it("should retrieve a student by ID", async () => {
            const res = await request(app)
                .get(`/api/students/${studentId}`)
                .set("Authorization", `Bearer ${coordToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("roll_number", "ROLL101");
        });

        it("should allow updating student profile", async () => {
            const res = await request(app)
                .put(`/api/students/${studentId}`)
                .set("Authorization", `Bearer ${coordToken}`)
                .send({
                    email: "alice@example.com",
                    full_name: "Alice Updated",
                    phone: "9876543210",
                    cgpa: 9.00,
                    backlogs: 0,
                    graduation_year: 2027,
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("student");
            expect(res.body.student).toHaveProperty("full_name", "Alice Updated");
            expect(res.body.student).toHaveProperty("cgpa", "9.00");
        });

        it("should allow deleting a student", async () => {
            const res = await request(app)
                .delete(`/api/students/${studentId}`)
                .set("Authorization", `Bearer ${coordToken}`);

            expect(res.statusCode).toBe(200);

            const check = await pool.query("SELECT * FROM students WHERE user_id = $1", [studentId]);
            expect(check.rows.length).toBe(0);
        });

        it("should deny student access to delete student endpoints", async () => {
            const res = await request(app)
                .delete(`/api/students/${studentId}`)
                .set("Authorization", `Bearer ${studentToken}`);

            expect(res.statusCode).toBe(403);
        });
    });
});
