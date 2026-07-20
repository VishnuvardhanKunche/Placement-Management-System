function validateUploadResume(req, res, next) {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "Please select a resume file to upload.",
        });
    }
    next();
}

function validateStudentIdParam(req, res, next) {
    const studentId = parseInt(req.params.studentId, 10);
    if (isNaN(studentId) || studentId <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid student ID. Must be a positive integer.",
        });
    }
    next();
}

module.exports = {
    validateUploadResume,
    validateStudentIdParam,
};
