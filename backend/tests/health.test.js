const request = require("supertest");
const app = require("../src/app");

describe("Health Check Endpoint", () => {
    it("should return 200 OK and diagnostic status information", async () => {
        const res = await request(app).get("/health");

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("success", true);
        expect(res.body).toHaveProperty("status", "UP");
        expect(res.body).toHaveProperty("database", "Connected");
        expect(res.body).toHaveProperty("uptime");
        expect(res.body).toHaveProperty("timestamp");
    });
});
