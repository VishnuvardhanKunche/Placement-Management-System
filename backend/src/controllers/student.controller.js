const studentService = require("../services/student.service");

async function createStudent(req, res) {
    try {
        const coordinatorId = req.user.id;
        const result = await studentService.createStudent(req.body, coordinatorId);
        res.status(201).json({
            message: "Student created successfully",
            student: result,
        });
    } catch (error) {
        console.error("Error in createStudent:", error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            message: error.statusCode ? error.message : "Internal server error",
        });
    }
}

async function getAllStudents(req, res) {
    try {
        const coordinatorId = req.user.id;
        const students = await studentService.getAllStudents(coordinatorId);
        res.status(200).json(students);
    } catch (error) {
        console.error("Error in getAllStudents:", error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            message: error.statusCode ? error.message : "Internal server error",
        });
    }
}

async function getStudentById(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const coordinatorId = req.user.id;
        const student = await studentService.getStudentById(id, coordinatorId);
        res.status(200).json(student);
    } catch (error) {
        console.error("Error in getStudentById:", error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            message: error.statusCode ? error.message : "Internal server error",
        });
    }
}

async function updateStudent(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const coordinatorId = req.user.id;
        const result = await studentService.updateStudent(id, req.body, coordinatorId);
        res.status(200).json({
            message: "Student updated successfully",
            student: result,
        });
    } catch (error) {
        console.error("Error in updateStudent:", error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            message: error.statusCode ? error.message : "Internal server error",
        });
    }
}

async function deleteStudent(req, res) {
    try {
        const id = parseInt(req.params.id, 10);
        const coordinatorId = req.user.id;
        await studentService.deleteStudent(id, coordinatorId);
        res.status(200).json({
            message: "Student deleted successfully",
        });
    } catch (error) {
        console.error("Error in deleteStudent:", error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            message: error.statusCode ? error.message : "Internal server error",
        });
    }
}

module.exports = {
    createStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
};
