const request = require("supertest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const pool = require("../src/config/db");

describe("Offer Management Tests", () => {
    let hashedPassword;
    let officerToken;
    let officerId;
    let companyUserId;
    let deptId;
    let studentId;
    let studentToken;
    let driveId;
    let applicationId;
    let offerId;

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

        // 6. Create Application (with 'selected' status)
        const appRes = await pool.query(
            "INSERT INTO applications (student_id, drive_id, status) VALUES ($1, $2, 'selected') RETURNING id",
            [studentId, driveId]
        );
        applicationId = appRes.rows[0].id;
    });

    describe("POST /api/offers (Create Offer)", () => {
        it("should allow a placement officer to issue a job offer for a selected application", async () => {
            const res = await request(app)
                .post("/api/offers")
                .set("Authorization", `Bearer ${officerToken}`)
                .send({
                    application_id: applicationId,
                    offer_letter_details: "Full time software engineer offer letter content",
                    salary_offered_lpa: 12.00,
                    joining_date: "2027-07-01",
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty("offer");
            expect(res.body.offer).toHaveProperty("offer_status", "pending");
            expect(res.body.offer).toHaveProperty("salary_offered_lpa", "12.00");
        });

        it("should reject offer creation if application is not in selected state", async () => {
            // Delete existing selected application first to avoid unique constraint violation
            await pool.query("DELETE FROM applications WHERE id = $1", [applicationId]);

            // Create a non-selected application
            const unselectedApp = await pool.query(
                "INSERT INTO applications (student_id, drive_id, status) VALUES ($1, $2, 'applied') RETURNING id",
                [studentId, driveId]
            );
            const unselectedAppId = unselectedApp.rows[0].id;

            const res = await request(app)
                .post("/api/offers")
                .set("Authorization", `Bearer ${officerToken}`)
                .send({
                    application_id: unselectedAppId,
                    offer_letter_details: "Should fail",
                    salary_offered_lpa: 8.00,
                    joining_date: "2027-07-01",
                });

            expect(res.statusCode).toBe(400);
        });
    });

    describe("Student Actions (Accept/Reject Offers)", () => {
        beforeEach(async () => {
            const offerRes = await pool.query(
                `INSERT INTO offers (application_id, offer_letter_details, salary_offered_lpa, joining_date, status, created_by_officer_id)
                 VALUES ($1, $2, $3, $4, 'pending', $5) RETURNING id`,
                [applicationId, "Details", 10.00, "2027-07-01", officerId]
            );
            offerId = offerRes.rows[0].id;
        });

        it("should allow a student to accept their pending offer", async () => {
            const res = await request(app)
                .patch(`/api/offers/${offerId}/accept`)
                .set("Authorization", `Bearer ${studentToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("offer");
            expect(res.body.offer).toHaveProperty("offer_status", "accepted");
        });

        it("should allow a student to reject their pending offer", async () => {
            const res = await request(app)
                .patch(`/api/offers/${offerId}/reject`)
                .set("Authorization", `Bearer ${studentToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("offer");
            expect(res.body.offer).toHaveProperty("offer_status", "rejected");
        });

        it("should reject double accepting an offer", async () => {
            await request(app)
                .patch(`/api/offers/${offerId}/accept`)
                .set("Authorization", `Bearer ${studentToken}`);

            const res = await request(app)
                .patch(`/api/offers/${offerId}/accept`)
                .set("Authorization", `Bearer ${studentToken}`);

            expect(res.statusCode).toBe(409);
        });
    });
});
