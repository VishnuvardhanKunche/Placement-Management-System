const request = require("supertest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = require("../src/app");
const pool = require("../src/config/db");

describe("Authentication Tests", () => {
    let hashedPassword;

    beforeAll(async () => {
        hashedPassword = await bcrypt.hash("password123", 10);
    });

    describe("POST /api/auth/company/register", () => {
        it("should successfully register a new company", async () => {
            const res = await request(app)
                .post("/api/auth/company/register")
                .send({
                    email: "newcompany@example.com",
                    password: "password123",
                    name: "New Corp",
                    industry: "Technology",
                    website: "http://newcorp.com",
                    description: "Software engineering",
                    contactPerson: "John Doe",
                    contactEmail: "john@newcorp.com",
                    contactPhone: "1234567890",
                });

            expect(res.statusCode).toBe(201);
            expect(res.body).toHaveProperty("id");
            expect(res.body).toHaveProperty("email", "newcompany@example.com");
        });

        it("should reject duplicate registration", async () => {
            await request(app)
                .post("/api/auth/company/register")
                .send({
                    email: "dup@example.com",
                    password: "password123",
                    name: "Dup Corp",
                    contactPerson: "Jane Doe",
                    contactEmail: "jane@dup.com",
                });

            const res = await request(app)
                .post("/api/auth/company/register")
                .send({
                    email: "dup@example.com",
                    password: "password123",
                    name: "Dup Corp",
                    contactPerson: "Jane Doe",
                    contactEmail: "jane@dup.com",
                });

            expect(res.statusCode).toBe(409);
        });

        it("should reject missing required fields", async () => {
            const res = await request(app)
                .post("/api/auth/company/register")
                .send({
                    email: "missing@example.com",
                });

            expect(res.statusCode).toBe(400);
        });
    });

    describe("POST /api/auth/login", () => {
        beforeEach(async () => {
            await pool.query(
                "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)",
                ["testuser@example.com", hashedPassword, "placement_officer"]
            );
        });

        it("should successfully login with correct credentials", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "testuser@example.com",
                    password: "password123",
                });

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("token");
            expect(res.body.user).toHaveProperty("email", "testuser@example.com");
        });

        it("should reject login with wrong password", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "testuser@example.com",
                    password: "wrongPassword",
                });

            expect(res.statusCode).toBe(401);
        });

        it("should reject login with missing email", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({
                    password: "password123",
                });

            expect(res.statusCode).toBe(400);
        });
    });

    describe("GET /api/auth/profile (Protected Route Access)", () => {
        let token;

        beforeEach(async () => {
            const userRes = await pool.query(
                "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id",
                ["profileuser@example.com", hashedPassword, "placement_officer"]
            );
            const userId = userRes.rows[0].id;
            await pool.query(
                "INSERT INTO placement_officers (user_id, full_name, phone) VALUES ($1, $2, $3)",
                [userId, "Officer Name", "1234567890"]
            );
            token = jwt.sign(
                { id: userId, role: "placement_officer" },
                process.env.JWT_SECRET || "test_jwt_secret_key_2026",
                { expiresIn: "24h" }
            );
        });

        it("should allow access with valid JWT token", async () => {
            const res = await request(app)
                .get("/api/auth/profile")
                .set("Authorization", `Bearer ${token}`);

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty("full_name", "Officer Name");
        });

        it("should reject access without token", async () => {
            const res = await request(app).get("/api/auth/profile");
            expect(res.statusCode).toBe(401);
        });

        it("should reject access with invalid token", async () => {
            const res = await request(app)
                .get("/api/auth/profile")
                .set("Authorization", "Bearer invalidtoken123");
            expect(res.statusCode).toBe(401);
        });

        it("should reject access with expired token", async () => {
            const expiredToken = jwt.sign(
                { id: 999, role: "placement_officer" },
                process.env.JWT_SECRET || "test_jwt_secret_key_2026",
                { expiresIn: "-1s" }
            );
            const res = await request(app)
                .get("/api/auth/profile")
                .set("Authorization", `Bearer ${expiredToken}`);
            expect(res.statusCode).toBe(401);
        });
    });
});
