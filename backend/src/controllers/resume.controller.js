const resumeService = require("../services/resume.service");

async function uploadResume(req, res) {
    try {
        const studentId = req.user.id;
        const result = await resumeService.uploadOrReplaceResume(studentId, req.file);
        res.status(200).json({
            success: true,
            message: "Resume uploaded successfully.",
            resume: result,
        });
    } catch (error) {
        console.error("Error in uploadResume:", error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.statusCode ? error.message : "Internal server error",
        });
    }
}

async function getResumeMe(req, res) {
    try {
        const studentId = req.user.id;
        const result = await resumeService.getStudentResumeMe(studentId);
        res.status(200).json({
            success: true,
            resume: result,
        });
    } catch (error) {
        console.error("Error in getResumeMe:", error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.statusCode ? error.message : "Internal server error",
        });
    }
}

async function getResumeByStudentId(req, res) {
    try {
        const studentId = parseInt(req.params.studentId, 10);
        const result = await resumeService.getStudentResumeByOfficerOrCoordinator(studentId, req.user);
        res.status(200).json({
            success: true,
            resume: result,
        });
    } catch (error) {
        console.error("Error in getResumeByStudentId:", error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.statusCode ? error.message : "Internal server error",
        });
    }
}

async function deleteResume(req, res) {
    try {
        const studentId = req.user.id;
        await resumeService.deleteStudentResume(studentId);
        res.status(200).json({
            success: true,
            message: "Resume deleted successfully.",
        });
    } catch (error) {
        console.error("Error in deleteResume:", error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            success: false,
            message: error.statusCode ? error.message : "Internal server error",
        });
    }
}

module.exports = {
    uploadResume,
    getResumeMe,
    getResumeByStudentId,
    deleteResume,
};
