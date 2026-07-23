const request = require("supertest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const pool = require("../src/config/db");

describe("Company Management Tests", () => {
    let hashedPassword;
    let officerToken;
    let officerId;
    let companyUserId;

    beforeAll(async () => {
        hashedPassword = await bcrypt.hash("password123", 10);
    });

    beforeEach(async () => {
        // 1. Insert Placement Officer User & Profile
        const officerUser = await pool.query(
            "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id",
            ["officer@college.edu", hashedPassword, "placement_officer"]
        );
        officerId = officerUser.rows[0].id;
        await pool.query(
            "INSERT INTO placement_officers (user_id, full_name, phone) VALUES ($1, $2, $3)",
            [officerId, "Placement Officer", "1234567890"]
        );

        officerToken = jwt.sign(
            { id: officerId, role: "placement_officer" },
            process.env.JWT_SECRET || "test_jwt_secret_key_2026",
            { expiresIn: "24h" }
        );

        // 2. Insert a Pending Company User & Profile
        const companyUser = await pool.query(
            "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id",
            ["company@example.com", hashedPassword, "company"]
        );
        companyUserId = companyUser.rows[0].id;
        await pool.query(
            `INSERT INTO companies (user_id, name, industry, website, description, contact_person, contact_email, contact_phone, is_approved)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE)`,
            [
                companyUserId,
                "TechCorp",
                "Software",
                "http://techcorp.com",
                "Tech description",
                "Jane Doe",
                "jane@techcorp.com",
                "9876543210",
            ]
        );
    });

    it("should allow placement officers to list all companies", async () => {
        const res = await request(app)
            .get("/api/companies")
            .set("Authorization", `Bearer ${officerToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });

    it("should allow placement officers to list pending companies", async () => {
        const res = await request(app)
            .get("/api/companies/pending")
            .set("Authorization", `Bearer ${officerToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body[0]).toHaveProperty("name", "TechCorp");
    });

    it("should allow retrieving a company profile by ID", async () => {
        const res = await request(app)
            .get(`/api/companies/${companyUserId}`)
            .set("Authorization", `Bearer ${officerToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("name", "TechCorp");
    });

    it("should allow placement officers to approve a company", async () => {
        const res = await request(app)
            .patch(`/api/companies/${companyUserId}/approve`)
            .set("Authorization", `Bearer ${officerToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("company");

        const check = await pool.query("SELECT * FROM companies WHERE user_id = $1", [companyUserId]);
        expect(check.rows[0].is_approved).toBe(true);
    });

    it("should allow placement officers to reject an approved company", async () => {
        // Approve first
        await pool.query(
            "UPDATE companies SET is_approved = TRUE, approved_by_officer_id = $2 WHERE user_id = $1",
            [companyUserId, officerId]
        );

        const res = await request(app)
            .patch(`/api/companies/${companyUserId}/reject`)
            .set("Authorization", `Bearer ${officerToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("company");

        const check = await pool.query("SELECT * FROM companies WHERE user_id = $1", [companyUserId]);
        expect(check.rows[0].is_approved).toBe(false);
    });

    it("should deny access to companies listing companies list", async () => {
        const companyToken = jwt.sign(
            { id: companyUserId, role: "company" },
            process.env.JWT_SECRET || "test_jwt_secret_key_2026",
            { expiresIn: "24h" }
        );

        const res = await request(app)
            .get("/api/companies")
            .set("Authorization", `Bearer ${companyToken}`);

        expect(res.statusCode).toBe(403);
    });
});
