const express = require("express");
const router = express.Router();
const resumeController = require("../controllers/resume.controller");
const authenticateToken = require("../middleware/authenticateToken");
const authorizeRoles = require("../middleware/authorizeRoles");
const uploadResumeMiddleware = require("../middleware/uploadResume");
const {
    validateUploadResume,
    validateStudentIdParam,
} = require("../validators/resume.validator");

// Apply JWT authentication globally
router.use(authenticateToken);

// Student Endpoints
router.post(
    "/upload",
    authorizeRoles("student"),
    uploadResumeMiddleware,
    validateUploadResume,
    resumeController.uploadResume
);

router.get(
    "/me",
    authorizeRoles("student"),
    resumeController.getResumeMe
);

router.delete(
    "/",
    authorizeRoles("student"),
    resumeController.deleteResume
);

// Placement Officer and Department Coordinator Endpoint
router.get(
    "/student/:studentId",
    authorizeRoles("placement_officer", "department_coordinator"),
    validateStudentIdParam,
    resumeController.getResumeByStudentId
);

module.exports = router;
