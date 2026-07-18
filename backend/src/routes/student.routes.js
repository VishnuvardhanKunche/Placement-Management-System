const express = require("express");
const router = express.Router();
const studentController = require("../controllers/student.controller");
const authenticateToken = require("../middleware/authenticateToken");
const authorizeRoles = require("../middleware/authorizeRoles");
const {
    validateCreateInput,
    validateUpdateInput,
    validateStudentId,
} = require("../validators/student.validator");

// Apply Department Coordinator authentication and authorization guards globally
router.use(authenticateToken);
router.use(authorizeRoles("department_coordinator"));

router.post("/", validateCreateInput, studentController.createStudent);
router.get("/", studentController.getAllStudents);
router.get("/:id", validateStudentId, studentController.getStudentById);
router.put("/:id", validateStudentId, validateUpdateInput, studentController.updateStudent);
router.delete("/:id", validateStudentId, studentController.deleteStudent);
router.patch("/:id/verify", validateStudentId, studentController.verifyStudent);
router.patch("/:id/unverify", validateStudentId, studentController.unverifyStudent);

module.exports = router;
