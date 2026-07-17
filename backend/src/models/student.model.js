const pool = require("../config/db");

async function createStudentProfile(
    userId,
    rollNumber,
    fullName,
    departmentId,
    phone,
    cgpa,
    backlogs,
    graduationYear,
    client = pool
) {
    const result = await client.query(
        `INSERT INTO students (
            user_id, roll_number, full_name, department_id, phone, 
            cgpa, backlogs, graduation_year, is_verified, verified_by_coordinator_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE, NULL) 
        RETURNING user_id, roll_number, full_name, department_id, phone, cgpa, backlogs, graduation_year, is_verified`,
        [
            userId,
            rollNumber,
            fullName,
            departmentId,
            phone,
            cgpa,
            backlogs,
            graduationYear,
        ]
    );
    return result.rows[0];
}

async function getStudentByRollNumber(rollNumber) {
    const result = await pool.query(
        "SELECT * FROM students WHERE LOWER(roll_number) = LOWER($1)",
        [rollNumber]
    );
    return result.rows[0] || null;
}

async function getStudentsByDepartment(departmentId) {
    const result = await pool.query(
        `SELECT s.user_id, s.roll_number, s.full_name, s.department_id, s.phone,
                s.cgpa, s.backlogs, s.graduation_year, s.resume_path, s.is_verified, s.verified_by_coordinator_id,
                u.email, u.is_active, u.created_at, u.updated_at,
                d.code AS department_code, d.name AS department_name
         FROM students s
         JOIN users u ON s.user_id = u.id
         JOIN departments d ON s.department_id = d.id
         WHERE s.department_id = $1
         ORDER BY s.full_name`,
        [departmentId]
    );
    return result.rows;
}

async function getStudentById(userId) {
    const result = await pool.query(
        `SELECT s.user_id, s.roll_number, s.full_name, s.department_id, s.phone,
                s.cgpa, s.backlogs, s.graduation_year, s.resume_path, s.is_verified, s.verified_by_coordinator_id,
                u.email, u.is_active, u.created_at, u.updated_at,
                d.code AS department_code, d.name AS department_name
         FROM students s
         JOIN users u ON s.user_id = u.id
         JOIN departments d ON s.department_id = d.id
         WHERE s.user_id = $1`,
        [userId]
    );
    return result.rows[0] || null;
}

async function updateStudentProfile(
    userId,
    fullName,
    phone,
    cgpa,
    backlogs,
    graduationYear,
    client = pool
) {
    const result = await client.query(
        `UPDATE students
         SET full_name = $2, phone = $3, cgpa = $4, backlogs = $5, graduation_year = $6, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1
         RETURNING *`,
        [userId, fullName, phone, cgpa, backlogs, graduationYear]
    );
    return result.rows[0];
}

module.exports = {
    createStudentProfile,
    getStudentByRollNumber,
    getStudentsByDepartment,
    getStudentById,
    updateStudentProfile,
};
