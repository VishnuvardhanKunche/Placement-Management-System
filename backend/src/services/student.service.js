const bcrypt = require("bcrypt");
const pool = require("../config/db");
const userModel = require("../models/user.model");
const studentModel = require("../models/student.model");
const coordinatorModel = require("../models/coordinator.model");

async function getCoordinatorDepartment(coordinatorId) {
    const coordinator = await coordinatorModel.getCoordinatorById(coordinatorId);
    if (!coordinator) {
        const error = new Error("Access denied. Department coordinator profile not found.");
        error.statusCode = 403;
        throw error;
    }
    return coordinator.department_id;
}

async function createStudent(data, coordinatorId) {
    const { email, password, roll_number, full_name, phone, cgpa, backlogs, graduation_year } = data;

    // 1. Resolve coordinator department
    const departmentId = await getCoordinatorDepartment(coordinatorId);

    // 2. Validate email uniqueness
    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser) {
        const error = new Error("Email is already registered");
        error.statusCode = 409;
        throw error;
    }

    // 3. Validate roll number uniqueness
    const existingStudent = await studentModel.getStudentByRollNumber(roll_number);
    if (existingStudent) {
        const error = new Error("Roll number is already in use");
        error.statusCode = 409;
        throw error;
    }

    // 4. Hash password
    const hash = await bcrypt.hash(password, 10);

    // 5. Database transaction
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        const user = await userModel.createUser(email, hash, "student", client);
        const profile = await studentModel.createStudentProfile(
            user.id,
            roll_number,
            full_name,
            departmentId,
            phone,
            cgpa,
            backlogs,
            graduation_year,
            client
        );

        await client.query("COMMIT");

        return {
            user_id: user.id,
            email: user.email,
            role: user.role,
            is_active: user.is_active,
            roll_number: profile.roll_number,
            full_name: profile.full_name,
            department_id: profile.department_id,
            phone: profile.phone,
            cgpa: profile.cgpa,
            backlogs: profile.backlogs,
            graduation_year: profile.graduation_year,
            is_verified: profile.is_verified,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function getAllStudents(coordinatorId) {
    const departmentId = await getCoordinatorDepartment(coordinatorId);
    return await studentModel.getStudentsByDepartment(departmentId);
}

async function getStudentById(id, coordinatorId) {
    const departmentId = await getCoordinatorDepartment(coordinatorId);

    const student = await studentModel.getStudentById(id);
    if (!student) {
        const error = new Error("Student not found");
        error.statusCode = 404;
        throw error;
    }

    // Enforce coordinator department isolation check
    if (student.department_id !== departmentId) {
        const error = new Error("Access denied. Student does not belong to your department.");
        error.statusCode = 403;
        throw error;
    }

    return student;
}

async function updateStudent(id, data, coordinatorId) {
    const { email, full_name, phone, cgpa, backlogs, graduation_year } = data;

    const departmentId = await getCoordinatorDepartment(coordinatorId);

    // 1. Check if student exists
    const student = await studentModel.getStudentById(id);
    if (!student) {
        const error = new Error("Student not found");
        error.statusCode = 404;
        throw error;
    }

    // 2. Enforce coordinator department isolation check
    if (student.department_id !== departmentId) {
        const error = new Error("Access denied. Student does not belong to your department.");
        error.statusCode = 403;
        throw error;
    }

    // 3. Verify new email uniqueness
    const existingUser = await userModel.getUserByEmail(email);
    if (existingUser && existingUser.id !== id) {
        const error = new Error("Email is already in use by another user");
        error.statusCode = 409;
        throw error;
    }

    // 4. Database transaction
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        await userModel.updateUserEmail(id, email, client);
        const profile = await studentModel.updateStudentProfile(
            id,
            full_name,
            phone,
            cgpa,
            backlogs,
            graduation_year,
            client
        );

        await client.query("COMMIT");

        return {
            user_id: id,
            email,
            roll_number: student.roll_number,
            full_name: profile.full_name,
            department_id: student.department_id,
            phone: profile.phone,
            cgpa: profile.cgpa,
            backlogs: profile.backlogs,
            graduation_year: profile.graduation_year,
            is_verified: student.is_verified,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

async function deleteStudent(id, coordinatorId) {
    const departmentId = await getCoordinatorDepartment(coordinatorId);

    // 1. Check if student exists
    const student = await studentModel.getStudentById(id);
    if (!student) {
        const error = new Error("Student not found");
        error.statusCode = 404;
        throw error;
    }

    // 2. Enforce coordinator department isolation check
    if (student.department_id !== departmentId) {
        const error = new Error("Access denied. Student does not belong to your department.");
        error.statusCode = 403;
        throw error;
    }

    // 3. Delete user account (cascades profile deletion)
    return await userModel.deleteUser(id);
}

async function verifyStudent(studentId, coordinatorId) {
    const departmentId = await getCoordinatorDepartment(coordinatorId);

    // 1. Check if student exists
    const student = await studentModel.getStudentById(studentId);
    if (!student) {
        const error = new Error("Student not found");
        error.statusCode = 404;
        throw error;
    }

    // 2. Enforce coordinator department isolation check
    if (student.department_id !== departmentId) {
        const error = new Error("Access denied. Student does not belong to your department.");
        error.statusCode = 403;
        throw error;
    }

    // 3. Prevent duplicate verification
    if (student.is_verified) {
        const error = new Error("Student is already verified");
        error.statusCode = 409;
        throw error;
    }

    return await studentModel.verifyStudent(studentId, coordinatorId);
}

async function unverifyStudent(studentId, coordinatorId) {
    const departmentId = await getCoordinatorDepartment(coordinatorId);

    // 1. Check if student exists
    const student = await studentModel.getStudentById(studentId);
    if (!student) {
        const error = new Error("Student not found");
        error.statusCode = 404;
        throw error;
    }

    // 2. Enforce coordinator department isolation check
    if (student.department_id !== departmentId) {
        const error = new Error("Access denied. Student does not belong to your department.");
        error.statusCode = 403;
        throw error;
    }

    // 3. Prevent duplicate unverification
    if (!student.is_verified) {
        const error = new Error("Student is already unverified");
        error.statusCode = 409;
        throw error;
    }

    return await studentModel.unverifyStudent(studentId);
}

module.exports = {
    createStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
    verifyStudent,
    unverifyStudent,
};
