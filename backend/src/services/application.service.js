const applicationModel = require("../models/application.model");
const studentModel = require("../models/student.model");
const driveModel = require("../models/drive.model");

async function applyForDrive(studentId, driveId) {
    // 1. Verify student exists
    const student = await studentModel.getStudentById(studentId);
    if (!student) {
        const error = new Error("Student profile not found");
        error.statusCode = 404;
        throw error;
    }

    // 2. Verify student is verified
    if (!student.is_verified) {
        const error = new Error("Student profile is not verified. Please contact your department coordinator.");
        error.statusCode = 400;
        throw error;
    }

    // 3. Verify placement drive exists
    const drive = await driveModel.getDriveById(driveId);
    if (!drive) {
        const error = new Error("Placement drive not found");
        error.statusCode = 404;
        throw error;
    }

    // 4. Verify drive status is published
    if (drive.status !== "published") {
        const error = new Error("Placement drive is not currently accepting applications");
        error.statusCode = 400;
        throw error;
    }

    // 5. Verify registration deadline has not passed
    const now = new Date();
    const deadline = new Date(drive.registration_deadline);
    if (now > deadline) {
        const error = new Error("Registration deadline for this drive has passed");
        error.statusCode = 400;
        throw error;
    }

    // 6. Verify department eligibility
    if (drive.eligible_departments && drive.eligible_departments.length > 0) {
        const isEligible = drive.eligible_departments.some(
            (dept) => dept.id === student.department_id
        );
        if (!isEligible) {
            const error = new Error("Your department is not eligible for this placement drive");
            error.statusCode = 400;
            throw error;
        }
    }

    // 7. Verify student CGPA satisfies requirement
    if (parseFloat(student.cgpa) < parseFloat(drive.min_cgpa)) {
        const error = new Error(
            `Your CGPA (${student.cgpa}) does not meet the minimum requirement (${drive.min_cgpa}) for this drive`
        );
        error.statusCode = 400;
        throw error;
    }

    // 8. Verify backlog count does not exceed limit
    if (parseInt(student.backlogs, 10) > parseInt(drive.max_backlogs_allowed, 10)) {
        const error = new Error(
            `Your backlog count (${student.backlogs}) exceeds the maximum allowed limit (${drive.max_backlogs_allowed}) for this drive`
        );
        error.statusCode = 400;
        throw error;
    }

    // 9. Verify student has not already applied for the drive
    const existingApplication = await applicationModel.getStudentApplicationByDriveId(
        studentId,
        driveId
    );
    if (existingApplication) {
        const error = new Error("You have already applied for this placement drive");
        error.statusCode = 409;
        throw error;
    }

    // 10. Create application
    const application = await applicationModel.createApplication(studentId, driveId);

    // Notify Placement Officers
    const notificationService = require("./notification.service");
    notificationService.notifyUsersByRole(
        "placement_officer",
        "New Application Submitted",
        `${student.full_name} applied for placement drive: ${drive.title}`,
        "application",
        "application",
        application.id
    );

    // Send Application Submitted Email to applicant
    const emailService = require("./email.service");
    try {
        await emailService.sendApplicationSubmittedEmail(student.email, {
            name: student.full_name,
            driveTitle: drive.title,
            companyName: drive.company_name,
        });
    } catch (err) {
        console.error("Email Error:", err.message);
    }

    return await applicationModel.getApplicationById(application.id);
}

async function getStudentApplications(studentId) {
    return await applicationModel.getStudentApplications(studentId);
}

async function getStudentApplicationById(applicationId, studentId) {
    const application = await applicationModel.getApplicationById(applicationId);
    if (!application) {
        const error = new Error("Application not found");
        error.statusCode = 404;
        throw error;
    }

    if (application.student_id !== studentId) {
        const error = new Error("Access denied. You can only view your own applications.");
        error.statusCode = 403;
        throw error;
    }

    return application;
}

async function withdrawApplication(applicationId, studentId) {
    const application = await applicationModel.getApplicationById(applicationId);
    if (!application) {
        const error = new Error("Application not found");
        error.statusCode = 404;
        throw error;
    }

    if (application.student_id !== studentId) {
        const error = new Error("Access denied. You can only withdraw your own applications.");
        error.statusCode = 403;
        throw error;
    }

    if (application.status !== "applied") {
        const error = new Error(
            `Application cannot be withdrawn because its status is '${application.status}'`
        );
        error.statusCode = 400;
        throw error;
    }

    await applicationModel.updateApplicationStatus(applicationId, "withdrawn");
    return await applicationModel.getApplicationById(applicationId);
}

async function getAllApplications() {
    return await applicationModel.getAllApplications();
}

async function getApplicationsByDriveId(driveId) {
    const drive = await driveModel.getDriveById(driveId);
    if (!drive) {
        const error = new Error("Placement drive not found");
        error.statusCode = 404;
        throw error;
    }

    return await applicationModel.getApplicationsByDriveId(driveId);
}

async function updateApplicationStatus(applicationId, status, feedback) {
    const application = await applicationModel.getApplicationById(applicationId);
    if (!application) {
        const error = new Error("Application not found");
        error.statusCode = 404;
        throw error;
    }

    await applicationModel.updateApplicationStatus(applicationId, status, feedback);
    const updatedApplication = await applicationModel.getApplicationById(applicationId);

    // Trigger status update emails
    const emailService = require("./email.service");
    try {
        const emailData = {
            name: updatedApplication.student_name,
            driveTitle: updatedApplication.drive_title,
            companyName: updatedApplication.company_name,
        };

        if (status === "shortlisted") {
            await emailService.sendApplicationShortlistedEmail(updatedApplication.student_email, emailData);
        } else if (status === "selected") {
            await emailService.sendApplicationSelectedEmail(updatedApplication.student_email, emailData);
        } else if (status === "rejected") {
            await emailService.sendApplicationRejectedEmail(updatedApplication.student_email, emailData);
        }
    } catch (err) {
        console.error("Email Error:", err.message);
    }

    return updatedApplication;
}

module.exports = {
    applyForDrive,
    getStudentApplications,
    getStudentApplicationById,
    withdrawApplication,
    getAllApplications,
    getApplicationsByDriveId,
    updateApplicationStatus,
};
