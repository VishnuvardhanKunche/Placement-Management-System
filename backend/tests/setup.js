const fs = require("fs");
const path = require("path");
const pool = require("../src/config/db");

beforeAll(async () => {
    // Load schema.sql to initialize database schema from scratch
    const schemaSql = fs.readFileSync(
        path.resolve(__dirname, "../../database/schema.sql"),
        "utf8"
    );
    await pool.query(schemaSql);
});

beforeEach(async () => {
    // Truncate tables to ensure test isolation
    await pool.query(`
        TRUNCATE TABLE 
            notifications, 
            offers, 
            applications, 
            drive_eligible_departments, 
            placement_drives, 
            companies, 
            students, 
            department_coordinators, 
            placement_officers, 
            departments, 
            users 
        CASCADE
    `);
});

afterAll(async () => {
    // Cleanly close Postgres connections
    await pool.end();
});
