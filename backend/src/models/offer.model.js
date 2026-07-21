const pool = require("../config/db");

async function createOffer(
    applicationId,
    offerLetterDetails,
    salaryOfferedLpa,
    joiningDate,
    officerId,
    client = pool
) {
    const result = await client.query(
        `INSERT INTO offers (
            application_id, offer_letter_details, salary_offered_lpa, joining_date, created_by_officer_id, status
        ) VALUES ($1, $2, $3, $4, $5, 'pending')
        RETURNING *`,
        [applicationId, offerLetterDetails, salaryOfferedLpa, joiningDate, officerId]
    );
    return result.rows[0];
}

async function getOfferById(offerId) {
    const result = await pool.query(
        `SELECT o.id, o.application_id, o.offer_letter_details, o.salary_offered_lpa, o.joining_date,
                o.status AS offer_status, o.created_by_officer_id, o.created_at, o.updated_at,
                a.student_id, a.drive_id, a.status AS application_status,
                s.roll_number, s.full_name AS student_name, s.phone AS student_phone,
                u.email AS student_email,
                d.code AS department_code, d.name AS department_name,
                pd.title AS drive_title, pd.job_role,
                c.name AS company_name, c.contact_email AS company_email, uc.email AS company_account_email,
                po.full_name AS officer_name
         FROM offers o
         JOIN applications a ON o.application_id = a.id
         JOIN students s ON a.student_id = s.user_id
         JOIN users u ON s.user_id = u.id
         JOIN departments d ON s.department_id = d.id
         JOIN placement_drives pd ON a.drive_id = pd.id
         JOIN companies c ON pd.company_id = c.user_id
         JOIN users uc ON c.user_id = uc.id
         LEFT JOIN placement_officers po ON o.created_by_officer_id = po.user_id
         WHERE o.id = $1`,
        [offerId]
    );
    return result.rows[0] || null;
}

async function getOfferByApplicationId(applicationId) {
    const result = await pool.query(
        `SELECT * FROM offers WHERE application_id = $1`,
        [applicationId]
    );
    return result.rows[0] || null;
}

async function getAllOffers() {
    const result = await pool.query(
        `SELECT o.id, o.application_id, o.offer_letter_details, o.salary_offered_lpa, o.joining_date,
                o.status AS offer_status, o.created_at, o.updated_at,
                a.student_id, a.drive_id,
                s.roll_number, s.full_name AS student_name,
                u.email AS student_email,
                d.code AS department_code,
                pd.title AS drive_title,
                c.name AS company_name
         FROM offers o
         JOIN applications a ON o.application_id = a.id
         JOIN students s ON a.student_id = s.user_id
         JOIN users u ON s.user_id = u.id
         JOIN departments d ON s.department_id = d.id
         JOIN placement_drives pd ON a.drive_id = pd.id
         JOIN companies c ON pd.company_id = c.user_id
         ORDER BY o.created_at DESC`
    );
    return result.rows;
}

async function getOffersByStudentId(studentId) {
    const result = await pool.query(
        `SELECT o.id, o.application_id, o.offer_letter_details, o.salary_offered_lpa, o.joining_date,
                o.status AS offer_status, o.created_at, o.updated_at,
                pd.title AS drive_title, pd.job_role,
                c.name AS company_name
         FROM offers o
         JOIN applications a ON o.application_id = a.id
         JOIN placement_drives pd ON a.drive_id = pd.id
         JOIN companies c ON pd.company_id = c.user_id
         WHERE a.student_id = $1
         ORDER BY o.created_at DESC`,
        [studentId]
    );
    return result.rows;
}

async function updateOffer(offerId, offerLetterDetails, salaryOfferedLpa, joiningDate) {
    const result = await pool.query(
        `UPDATE offers
         SET offer_letter_details = $2, salary_offered_lpa = $3, joining_date = $4, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [offerId, offerLetterDetails, salaryOfferedLpa, joiningDate]
    );
    return result.rows[0];
}

async function updateOfferStatus(offerId, status) {
    const result = await pool.query(
        `UPDATE offers
         SET status = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING *`,
        [offerId, status]
    );
    return result.rows[0];
}

async function deleteOffer(offerId) {
    const result = await pool.query(
        `DELETE FROM offers WHERE id = $1 RETURNING id`,
        [offerId]
    );
    return result.rowCount > 0;
}

module.exports = {
    createOffer,
    getOfferById,
    getOfferByApplicationId,
    getAllOffers,
    getOffersByStudentId,
    updateOffer,
    updateOfferStatus,
    deleteOffer,
};
