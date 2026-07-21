const { transporter, defaultFrom } = require("../email/transporter");
const templates = require("../email/templates");

async function sendEmail({ to, subject, html, text }) {
    try {
        if (!to) {
            console.error("[Email Service Error] Recipient address 'to' is missing");
            return { success: false, error: "Recipient address missing" };
        }

        const mailOptions = {
            from: defaultFrom,
            to: to,
            subject: subject,
            html: html,
            text: text || "Please use an HTML compatible email viewer to view this email.",
        };

        const info = await transporter.sendMail(mailOptions);
        return {
            success: true,
            messageId: info.messageId,
        };
    } catch (error) {
        console.error(`[Email Service Failure] Error sending email to ${to}:`, error.message);
        return {
            success: false,
            error: error.message,
        };
    }
}

async function sendWelcomeEmail(to, data) {
    const html = templates.welcomeTemplate(data);
    return await sendEmail({
        to,
        subject: "Welcome to Placement Cell Management System",
        html,
    });
}

async function sendVerificationEmail(to, data) {
    const html = templates.verificationTemplate(data);
    return await sendEmail({
        to,
        subject: "Student Profile Verified - Placement Cell",
        html,
    });
}

async function sendDrivePublishedEmail(to, data) {
    const html = templates.drivePublishedTemplate(data);
    return await sendEmail({
        to,
        subject: `New Placement Drive: ${data.driveTitle || 'Recruitment Drive'}`,
        html,
    });
}

async function sendApplicationSubmittedEmail(to, data) {
    const html = templates.applicationSubmittedTemplate(data);
    return await sendEmail({
        to,
        subject: `Application Confirmation: ${data.driveTitle}`,
        html,
    });
}

async function sendApplicationShortlistedEmail(to, data) {
    const html = templates.applicationShortlistedTemplate(data);
    return await sendEmail({
        to,
        subject: `Application Shortlisted: ${data.driveTitle}`,
        html,
    });
}

async function sendApplicationSelectedEmail(to, data) {
    const html = templates.applicationSelectedTemplate(data);
    return await sendEmail({
        to,
        subject: `Selected: ${data.driveTitle}`,
        html,
    });
}

async function sendApplicationRejectedEmail(to, data) {
    const html = templates.applicationRejectedTemplate(data);
    return await sendEmail({
        to,
        subject: `Application Update: ${data.driveTitle}`,
        html,
    });
}

async function sendOfferReceivedEmail(to, data) {
    const html = templates.offerReceivedTemplate(data);
    return await sendEmail({
        to,
        subject: `Job Offer Received: ${data.driveTitle}`,
        html,
    });
}

async function sendOfferAcceptedEmail(to, data) {
    const html = templates.offerAcceptedTemplate(data);
    return await sendEmail({
        to,
        subject: `Offer Accepted by ${data.studentName}`,
        html,
    });
}

async function sendCompanyApprovedEmail(to, data) {
    const html = templates.companyApprovedTemplate(data);
    return await sendEmail({
        to,
        subject: `Company Profile Approved - ${data.companyName}`,
        html,
    });
}

async function sendPasswordResetEmail(to, data) {
    const html = templates.passwordResetTemplate(data);
    return await sendEmail({
        to,
        subject: "Password Reset Request - Placement Cell",
        html,
    });
}

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendVerificationEmail,
    sendDrivePublishedEmail,
    sendApplicationSubmittedEmail,
    sendApplicationShortlistedEmail,
    sendApplicationSelectedEmail,
    sendApplicationRejectedEmail,
    sendOfferReceivedEmail,
    sendOfferAcceptedEmail,
    sendCompanyApprovedEmail,
    sendPasswordResetEmail,
};
