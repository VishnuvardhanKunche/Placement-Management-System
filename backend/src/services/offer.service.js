const offerModel = require("../models/offer.model");
const applicationModel = require("../models/application.model");

async function createOffer(data, officerId) {
    const { application_id, offer_letter_details, salary_offered_lpa, joining_date } = data;

    // 1. Verify application exists
    const application = await applicationModel.getApplicationById(application_id);
    if (!application) {
        const error = new Error("Application not found");
        error.statusCode = 404;
        throw error;
    }

    // 2. Verify application status is 'selected'
    if (application.status !== "selected") {
        const error = new Error(
            `Only applications with status 'selected' can receive an offer. Current application status is '${application.status}'`
        );
        error.statusCode = 400;
        throw error;
    }

    // 3. Check for existing duplicate offer
    const existingOffer = await offerModel.getOfferByApplicationId(application_id);
    if (existingOffer) {
        const error = new Error("An offer has already been issued for this application");
        error.statusCode = 409;
        throw error;
    }

    // 4. Create offer
    const offer = await offerModel.createOffer(
        application_id,
        offer_letter_details,
        salary_offered_lpa,
        joining_date,
        officerId
    );

    const createdOffer = await offerModel.getOfferById(offer.id);

    // Notify student
    const notificationService = require("./notification.service");
    notificationService.createNotification(
        application.student_id,
        "New Offer Received",
        `You have received a job offer for ${createdOffer.drive_title} with salary ${createdOffer.salary_offered_lpa} LPA.`,
        "offer",
        "offer",
        createdOffer.id
    );

    // Send Offer Received Email to student
    const emailService = require("./email.service");
    try {
        await emailService.sendOfferReceivedEmail(createdOffer.student_email, {
            name: createdOffer.student_name,
            driveTitle: createdOffer.drive_title,
            companyName: createdOffer.company_name,
            salary: createdOffer.salary_offered_lpa,
            joiningDate: createdOffer.joining_date,
        });
    } catch (err) {
        console.error("Email Error:", err.message);
    }

    return createdOffer;
}

async function getAllOffers() {
    return await offerModel.getAllOffers();
}

async function getOfferById(offerId) {
    const offer = await offerModel.getOfferById(offerId);
    if (!offer) {
        const error = new Error("Offer not found");
        error.statusCode = 404;
        throw error;
    }
    return offer;
}

async function updateOffer(offerId, data) {
    const { offer_letter_details, salary_offered_lpa, joining_date } = data;

    const offer = await offerModel.getOfferById(offerId);
    if (!offer) {
        const error = new Error("Offer not found");
        error.statusCode = 404;
        throw error;
    }

    if (offer.offer_status !== "pending") {
        const error = new Error(
            `Cannot modify an offer that has already been ${offer.offer_status}`
        );
        error.statusCode = 400;
        throw error;
    }

    await offerModel.updateOffer(offerId, offer_letter_details, salary_offered_lpa, joining_date);
    return await offerModel.getOfferById(offerId);
}

async function deleteOffer(offerId) {
    const offer = await offerModel.getOfferById(offerId);
    if (!offer) {
        const error = new Error("Offer not found");
        error.statusCode = 404;
        throw error;
    }
    return await offerModel.deleteOffer(offerId);
}

async function getStudentOffers(studentId) {
    return await offerModel.getOffersByStudentId(studentId);
}

async function acceptOffer(offerId, studentId) {
    const offer = await offerModel.getOfferById(offerId);
    if (!offer) {
        const error = new Error("Offer not found");
        error.statusCode = 404;
        throw error;
    }

    if (offer.student_id !== studentId) {
        const error = new Error("Access denied. You can only accept your own offers.");
        error.statusCode = 403;
        throw error;
    }

    if (offer.offer_status === "accepted") {
        const error = new Error("Offer has already been accepted.");
        error.statusCode = 409;
        throw error;
    }

    if (offer.offer_status === "rejected") {
        const error = new Error("Rejected offers cannot be accepted later.");
        error.statusCode = 409;
        throw error;
    }

    await offerModel.updateOfferStatus(offerId, "accepted");
    const updatedOffer = await offerModel.getOfferById(offerId);

    // Notify Placement Officers
    const notificationService = require("./notification.service");
    notificationService.notifyUsersByRole(
        "placement_officer",
        "Offer Accepted",
        `${updatedOffer.student_name} accepted the job offer for ${updatedOffer.drive_title}.`,
        "offer",
        "offer",
        updatedOffer.id
    );

    // Send Offer Accepted Email to Company
    const emailService = require("./email.service");
    try {
        const companyEmail = updatedOffer.company_email || updatedOffer.company_account_email;
        if (companyEmail) {
            await emailService.sendOfferAcceptedEmail(companyEmail, {
                officerName: updatedOffer.officer_name,
                studentName: updatedOffer.student_name,
                driveTitle: updatedOffer.drive_title,
                salary: updatedOffer.salary_offered_lpa,
            });
        }
    } catch (err) {
        console.error("Email Error:", err.message);
    }

    return updatedOffer;
}

async function rejectOffer(offerId, studentId) {
    const offer = await offerModel.getOfferById(offerId);
    if (!offer) {
        const error = new Error("Offer not found");
        error.statusCode = 404;
        throw error;
    }

    if (offer.student_id !== studentId) {
        const error = new Error("Access denied. You can only reject your own offers.");
        error.statusCode = 403;
        throw error;
    }

    if (offer.offer_status === "rejected") {
        const error = new Error("Offer has already been rejected.");
        error.statusCode = 409;
        throw error;
    }

    if (offer.offer_status === "accepted") {
        const error = new Error("Accepted offers cannot be rejected later.");
        error.statusCode = 409;
        throw error;
    }

    await offerModel.updateOfferStatus(offerId, "rejected");
    return await offerModel.getOfferById(offerId);
}

module.exports = {
    createOffer,
    getAllOffers,
    getOfferById,
    updateOffer,
    deleteOffer,
    getStudentOffers,
    acceptOffer,
    rejectOffer,
};
