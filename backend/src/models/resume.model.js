const pool = require("../config/db");

async function getStudentResume(studentId) {
    const result = await pool.query(
        `SELECT user_id, roll_number, full_name, department_id, resume_path
         FROM students
         WHERE user_id = $1`,
        [studentId]
    );
    return result.rows[0] || null;
}

async function updateResumePath(studentId, resumePath) {
    const result = await pool.query(
        `UPDATE students
         SET resume_path = $2, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1
         RETURNING user_id, resume_path`,
        [studentId, resumePath]
    );
    return result.rows[0];
}

async function removeResumePath(studentId) {
    const result = await pool.query(
        `UPDATE students
         SET resume_path = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1
         RETURNING user_id`,
        [studentId]
    );
    return result.rows[0];
}

module.exports = {
    getStudentResume,
    updateResumePath,
    removeResumePath,
};
