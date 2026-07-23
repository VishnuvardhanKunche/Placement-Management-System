const request = require("supertest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const pool = require("../src/config/db");

describe("Placement Application Tests", () => {
    let hashedPassword;
    let officerToken;
    let officerId;
    let companyUserId;
    let deptId;
    let studentId;
    let studentToken;
    let driveId;
    let applicationId;

    beforeAll(async () => {
        hashedPassword = await bcrypt.hash("password123", 10);
    });

    beforeEach(async () => {
        // 1. Create Officer
        const officerUser = await pool.query(
            "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id",
            ["officer@college.edu", hashedPassword, "placement_officer"]
        );
        officerId = officerUser.rows[0].id;
        await pool.query(
            "INSERT INTO placement_officers (user_id, full_name, phone) VALUES ($1, $2, $3)",
            [officerId, "Officer Name", "1234567890"]
        );

        officerToken = jwt.sign(
            { id: officerId, role: "placement_officer" },
            process.env.JWT_SECRET || "test_jwt_secret_key_2026",
            { expiresIn: "24h" }
        );

        // 2. Create Company
        const companyUser = await pool.query(
            "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id",
            ["partner@company.com", hashedPassword, "company"]
        );
        companyUserId = companyUser.rows[0].id;
        await pool.query(
            `INSERT INTO companies (user_id, name, industry, website, contact_person, contact_email, is_approved, approved_by_officer_id)
             VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7)`,
            [companyUserId, "BigTech", "Software", "http://bt.com", "John Corp", "john@bt.com", officerId]
        );

        // 3. Create Department
        const deptRes = await pool.query(
            "INSERT INTO departments (code, name, hod_name) VALUES ($1, $2, $3) RETURNING id",
            ["CSE", "Computer Science", "HOD CSE"]
        );
        deptId = deptRes.rows[0].id;

        // 4. Create and Verify Student
        const studentUser = await pool.query(
            "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id",
            ["student@college.edu", hashedPassword, "student"]
        );
        studentId = studentUser.rows[0].id;
        await pool.query(
            `INSERT INTO students (user_id, roll_number, full_name, department_id, phone, cgpa, backlogs, graduation_year, is_verified)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)`,
            [studentId, "ROLL201", "Alice Student", deptId, "9876543210", 9.00, 0, 2027]
        );

        studentToken = jwt.sign(
            { id: studentId, role: "student" },
            process.env.JWT_SECRET || "test_jwt_secret_key_2026",
            { expiresIn: "24h" }
        );

        // 5. Create Published Drive
        const driveRes = await pool.query(
            `INSERT INTO placement_drives (company_id, title, description, job_role, job_location, salary_lpa, min_cgpa, max_backlogs_allowed, registration_deadline, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'published') RETURNING id`,
            [
                companyUserId,
                "Mega Software Drive",
                "Software engineering hiring",
                "Dev",
                "Bangalore",
                10.00,
                7.00,
                0,
                new Date(Date.now() + 86400000), // future deadline
            ]
        );
        driveId = driveRes.rows[0].id;
        await pool.query(
            "INSERT INTO drive_eligible_departments (drive_id, department_id) VALUES ($1, $2)",
            [driveId, deptId]
        );
    });

    describe("POST /api/applications (Student Applies)", () => {
        it("should successfully apply for a drive", async () => {
            const res = await request(app)
                .post("/api/applications")
                .set("Authorization", `Bearer ${studentToken}`)
                .send({ drive_id: driveId });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty("application");
            expect(res.body.application).toHaveProperty("status", "applied");
        });

        it("should reject duplicate application to same drive", async () => {
            await request(app)
                .post("/api/applications")
                .set("Authorization", `Bearer ${studentToken}`)
                .send({ drive_id: driveId });

            const res = await request(app)
                .post("/api/applications")
                .set("Authorization", `Bearer ${studentToken}`)
                .send({ drive_id: driveId });

            expect(res.statusCode).toBe(409);
        });
    });

    describe("Application Status Actions", () => {
        beforeEach(async () => {
            const appRes = await pool.query(
                "INSERT INTO applications (student_id, drive_id, status) VALUES ($1, $2, 'applied') RETURNING id",
                [studentId, driveId]
            );
            applicationId = appRes.rows[0].id;
        });

        it("should allow student to withdraw application", async () => {
            const res = await request(app)
                .patch(`/api/applications/${applicationId}/withdraw`)
                .set("Authorization", `Bearer ${studentToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("application");
            expect(res.body.application).toHaveProperty("status", "withdrawn");
        });

        it("should allow officers to update application status to shortlisted", async () => {
            const res = await request(app)
                .patch(`/api/applications/${applicationId}/status`)
                .set("Authorization", `Bearer ${officerToken}`)
                .send({
                    status: "shortlisted",
                    feedback: "Candidate shortlisted",
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("application");
            expect(res.body.application).toHaveProperty("status", "shortlisted");
        });

        it("should allow officers to update application status to selected", async () => {
            const res = await request(app)
                .patch(`/api/applications/${applicationId}/status`)
                .set("Authorization", `Bearer ${officerToken}`)
                .send({
                    status: "selected",
                    feedback: "Hired!",
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("application");
            expect(res.body.application).toHaveProperty("status", "selected");
        });
    });
});
