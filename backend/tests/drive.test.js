const request = require("supertest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const pool = require("../src/config/db");

describe("Placement Drive Tests", () => {
    let hashedPassword;
    let officerToken;
    let officerId;
    let companyUserId;
    let deptId;
    let driveId;

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

        // 2. Create and Approve Company
        const companyUser = await pool.query(
            "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id",
            ["partner@company.com", hashedPassword, "company"]
        );
        companyUserId = companyUser.rows[0].id;
        await pool.query(
            `INSERT INTO companies (user_id, name, industry, website, description, contact_person, contact_email, contact_phone, is_approved, approved_by_officer_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $9)`,
            [
                companyUserId,
                "BigTech",
                "Software",
                "http://bigtech.com",
                "Big Tech description",
                "John Corp",
                "john@bigtech.com",
                "9876543210",
                officerId,
            ]
        );

        // 3. Create Department
        const deptRes = await pool.query(
            "INSERT INTO departments (code, name, hod_name) VALUES ($1, $2, $3) RETURNING id",
            ["CSE", "Computer Science", "HOD CSE"]
        );
        deptId = deptRes.rows[0].id;
    });

    describe("POST /api/drives", () => {
        it("should successfully create a new placement drive", async () => {
            const res = await request(app)
                .post("/api/drives")
                .set("Authorization", `Bearer ${officerToken}`)
                .send({
                    company_id: companyUserId,
                    title: "Mega Campus Drive 2026",
                    description: "Hiring CSE software development interns",
                    job_role: "Software Engineer Intern",
                    job_location: "Bangalore",
                    salary_details: "Stipend of 50K/month",
                    salary_lpa: 12.50,
                    min_cgpa: 7.00,
                    max_backlogs_allowed: 0,
                    registration_deadline: new Date(Date.now() + 86400000).toISOString(),
                    drive_date: new Date(Date.now() + 172800000).toISOString(),
                    eligible_departments: [deptId],
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty("drive");
            expect(res.body.drive).toHaveProperty("title", "Mega Campus Drive 2026");
        });

        it("should reject drive creation if company does not exist or is unapproved", async () => {
            const res = await request(app)
                .post("/api/drives")
                .set("Authorization", `Bearer ${officerToken}`)
                .send({
                    company_id: 99999,
                    title: "Unapproved Drive",
                    description: "Will fail",
                    job_role: "Intern",
                    salary_lpa: 5.00,
                    min_cgpa: 6.00,
                    max_backlogs_allowed: 1,
                    registration_deadline: new Date(Date.now() + 86400000).toISOString(),
                    eligible_departments: [deptId],
                });

            expect(res.statusCode).toBe(400);
        });
    });

    describe("Drive Lifecycle Operations", () => {
        beforeEach(async () => {
            const driveRes = await pool.query(
                `INSERT INTO placement_drives (company_id, title, description, job_role, job_location, salary_lpa, min_cgpa, max_backlogs_allowed, registration_deadline, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft') RETURNING id`,
                [
                    companyUserId,
                    "Draft Drive",
                    "Software development",
                    "Dev",
                    "Hyd",
                    6.50,
                    6.00,
                    1,
                    new Date(Date.now() + 86400000),
                ]
            );
            driveId = driveRes.rows[0].id;
            await pool.query(
                "INSERT INTO drive_eligible_departments (drive_id, department_id) VALUES ($1, $2)",
                [driveId, deptId]
            );
        });

        it("should retrieve all placement drives", async () => {
            const res = await request(app)
                .get("/api/drives")
                .set("Authorization", `Bearer ${officerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBeGreaterThanOrEqual(1);
        });

        it("should retrieve a drive by ID", async () => {
            const res = await request(app)
                .get(`/api/drives/${driveId}`)
                .set("Authorization", `Bearer ${officerToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("title", "Draft Drive");
        });

        it("should allow editing a drive", async () => {
            const res = await request(app)
                .put(`/api/drives/${driveId}`)
                .set("Authorization", `Bearer ${officerToken}`)
                .send({
                    company_id: companyUserId,
                    title: "Updated Title",
                    description: "Updated software development",
                    job_role: "Dev",
                    job_location: "Hyd",
                    salary_lpa: 8.50,
                    min_cgpa: 6.00,
                    max_backlogs_allowed: 1,
                    registration_deadline: new Date(Date.now() + 86400000).toISOString(),
                    eligible_departments: [deptId],
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("drive");
            expect(res.body.drive).toHaveProperty("title", "Updated Title");
        });

        it("should allow deleting a drive", async () => {
            const res = await request(app)
                .delete(`/api/drives/${driveId}`)
                .set("Authorization", `Bearer ${officerToken}`);

            expect(res.statusCode).toBe(200);

            const check = await pool.query("SELECT * FROM placement_drives WHERE id = $1", [driveId]);
            expect(check.rows.length).toBe(0);
        });
    });
});
