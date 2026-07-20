const fs = require("fs");
const path = require("path");
const resumeModel = require("../models/resume.model");
const coordinatorModel = require("../models/coordinator.model");

const BASE_URL = process.env.APP_BASE_URL || "http://localhost:5000";

function getAbsolutePath(relativePath) {
    if (!relativePath) return null;
    return path.join(__dirname, "../../", relativePath);
}

function deletePhysicalFile(relativePath) {
    if (!relativePath) return;
    try {
        const absPath = getAbsolutePath(relativePath);
        if (fs.existsSync(absPath)) {
            fs.unlinkSync(absPath);
        }
    } catch (error) {
        console.error("Error deleting physical file:", error);
    }
}

async function uploadOrReplaceResume(studentId, file) {
    const student = await resumeModel.getStudentResume(studentId);
    if (!student) {
        // Cleanup uploaded file if student does not exist
        deletePhysicalFile(`uploads/resumes/${file.filename}`);
        const error = new Error("Student profile not found.");
        error.statusCode = 404;
        throw error;
    }

    // 1. Delete previous file if present
    if (student.resume_path) {
        deletePhysicalFile(student.resume_path);
    }

    // 2. Relative path for storage in DB
    const relativePath = `uploads/resumes/${file.filename}`;

    // 3. Update database
    await resumeModel.updateResumePath(studentId, relativePath);

    // 4. Generate public URL
    const publicUrl = `${BASE_URL}/${relativePath}`;

    return {
        resume_path: relativePath,
        resume_url: publicUrl,
    };
}

async function getStudentResumeMe(studentId) {
    const student = await resumeModel.getStudentResume(studentId);
    if (!student) {
        const error = new Error("Student profile not found.");
        error.statusCode = 404;
        throw error;
    }

    if (!student.resume_path) {
        return {
            resume_path: null,
            resume_url: null,
        };
    }

    const publicUrl = `${BASE_URL}/${student.resume_path}`;
    return {
        resume_path: student.resume_path,
        resume_url: publicUrl,
    };
}

async function getStudentResumeByOfficerOrCoordinator(studentId, requestingUser) {
    const student = await resumeModel.getStudentResume(studentId);
    if (!student) {
        const error = new Error("Student profile not found.");
        error.statusCode = 404;
        throw error;
    }

    // Department Coordinator department boundary check
    if (requestingUser.role === "department_coordinator") {
        const coordinator = await coordinatorModel.getCoordinatorById(requestingUser.id);
        if (!coordinator || student.department_id !== coordinator.department_id) {
            const error = new Error("Forbidden: You can only view resumes for students belonging to your own department.");
            error.statusCode = 403;
            throw error;
        }
    }

    if (!student.resume_path) {
        return {
            resume_path: null,
            resume_url: null,
        };
    }

    const publicUrl = `${BASE_URL}/${student.resume_path}`;
    return {
        resume_path: student.resume_path,
        resume_url: publicUrl,
    };
}

async function deleteStudentResume(studentId) {
    const student = await resumeModel.getStudentResume(studentId);
    if (!student) {
        const error = new Error("Student profile not found.");
        error.statusCode = 404;
        throw error;
    }

    if (!student.resume_path) {
        const error = new Error("No resume found to delete.");
        error.statusCode = 400;
        throw error;
    }

    // Delete physical file from disk
    deletePhysicalFile(student.resume_path);

    // Update database
    await resumeModel.removeResumePath(studentId);

    return true;
}

module.exports = {
    uploadOrReplaceResume,
    getStudentResumeMe,
    getStudentResumeByOfficerOrCoordinator,
    deleteStudentResume,
};
