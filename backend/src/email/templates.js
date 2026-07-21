function baseLayout(title, content) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f6f9;
            margin: 0;
            padding: 0;
            color: #333333;
        }
        .container {
            max-width: 600px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
            color: #ffffff;
            padding: 24px 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 600;
            letter-spacing: 0.5px;
        }
        .content {
            padding: 30px;
            line-height: 1.6;
        }
        .info-box {
            background: #f8fafc;
            border-left: 4px solid #3b82f6;
            padding: 16px;
            margin: 20px 0;
            border-radius: 0 6px 6px 0;
        }
        .btn {
            display: inline-block;
            background: #2563eb;
            color: #ffffff !important;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
        }
        .footer {
            background: #f1f5f9;
            padding: 16px 30px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Placement Cell Management System</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Placement Cell Management System. All rights reserved.</p>
            <p>This is an automated notification. Please do not reply directly to this email.</p>
        </div>
    </div>
</body>
</html>`;
}

function welcomeTemplate({ name, role }) {
    const formattedRole = role ? role.replace("_", " ").toUpperCase() : "USER";
    const content = `
        <h2>Welcome to the Placement Cell, ${name}!</h2>
        <p>Your account has been successfully created with the role of <strong>${formattedRole}</strong>.</p>
        <p>You can now log in to access placement drives, manage your profile, and receive notifications regarding ongoing recruitment activities.</p>
        <div class="info-box">
            <p><strong>Account Role:</strong> ${formattedRole}</p>
            <p><strong>Status:</strong> Active</p>
        </div>
        <p>Best regards,<br/>Placement Cell Team</p>
    `;
    return baseLayout("Welcome to Placement Cell", content);
}

function verificationTemplate({ name }) {
    const content = `
        <h2>Profile Verification Update</h2>
        <p>Dear ${name},</p>
        <p>Great news! Your student profile has been verified by your Department Coordinator.</p>
        <div class="info-box">
            <p><strong>Verification Status:</strong> Verified ✅</p>
            <p>You are now eligible to apply for ongoing and upcoming placement drives matching your criteria.</p>
        </div>
        <p>Best regards,<br/>Placement Cell Team</p>
    `;
    return baseLayout("Profile Verification Verified", content);
}

function drivePublishedTemplate({ name, driveTitle, companyName, role, salary, deadline }) {
    const content = `
        <h2>New Placement Drive Published!</h2>
        <p>Hello ${name},</p>
        <p>A new placement drive has been published for eligible candidates.</p>
        <div class="info-box">
            <p><strong>Drive Title:</strong> ${driveTitle}</p>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Role:</strong> ${role || "N/A"}</p>
            <p><strong>Salary (LPA):</strong> ${salary ? salary + " LPA" : "As per industry standards"}</p>
            <p><strong>Registration Deadline:</strong> ${new Date(deadline).toLocaleString()}</p>
        </div>
        <p>Log in to your dashboard to review requirements and submit your application before the deadline.</p>
        <p>Best regards,<br/>Placement Cell Team</p>
    `;
    return baseLayout(`New Drive: ${driveTitle}`, content);
}

function applicationSubmittedTemplate({ name, driveTitle, companyName }) {
    const content = `
        <h2>Application Submitted Successfully</h2>
        <p>Hello ${name},</p>
        <p>Your application for <strong>${driveTitle}</strong> at <strong>${companyName}</strong> has been received.</p>
        <div class="info-box">
            <p><strong>Drive:</strong> ${driveTitle}</p>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Status:</strong> Applied</p>
        </div>
        <p>You will receive updates as the placement officer processes applications.</p>
        <p>Best regards,<br/>Placement Cell Team</p>
    `;
    return baseLayout(`Application Confirmation: ${driveTitle}`, content);
}

function applicationShortlistedTemplate({ name, driveTitle, companyName }) {
    const content = `
        <h2>Congratulations! You are Shortlisted 🎉</h2>
        <p>Dear ${name},</p>
        <p>We are pleased to inform you that your application for <strong>${driveTitle}</strong> at <strong>${companyName}</strong> has been shortlisted!</p>
        <div class="info-box">
            <p><strong>Drive:</strong> ${driveTitle}</p>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Status:</strong> Shortlisted ✅</p>
        </div>
        <p>Please check your student portal for next round details and instructions.</p>
        <p>Best regards,<br/>Placement Cell Team</p>
    `;
    return baseLayout(`Application Shortlisted: ${driveTitle}`, content);
}

function applicationSelectedTemplate({ name, driveTitle, companyName }) {
    const content = `
        <h2>Congratulations! You are Selected! 🥳</h2>
        <p>Dear ${name},</p>
        <p>Fantastic news! You have been selected for <strong>${driveTitle}</strong> at <strong>${companyName}</strong>.</p>
        <div class="info-box">
            <p><strong>Drive:</strong> ${driveTitle}</p>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Status:</strong> Selected 🌟</p>
        </div>
        <p>Our placement officer will issue your formal offer letter shortly.</p>
        <p>Best regards,<br/>Placement Cell Team</p>
    `;
    return baseLayout(`Selected: ${driveTitle}`, content);
}

function applicationRejectedTemplate({ name, driveTitle, companyName }) {
    const content = `
        <h2>Application Status Update</h2>
        <p>Dear ${name},</p>
        <p>Thank you for participating in the placement drive for <strong>${driveTitle}</strong> at <strong>${companyName}</strong>.</p>
        <div class="info-box">
            <p><strong>Drive:</strong> ${driveTitle}</p>
            <p><strong>Status:</strong> Process Completed</p>
        </div>
        <p>We encourage you to keep applying for other upcoming placement drives on your portal.</p>
        <p>Best regards,<br/>Placement Cell Team</p>
    `;
    return baseLayout(`Application Update: ${driveTitle}`, content);
}

function offerReceivedTemplate({ name, driveTitle, companyName, salary, joiningDate }) {
    const content = `
        <h2>You Have Received a Placement Offer! 📄</h2>
        <p>Dear ${name},</p>
        <p>An official placement offer has been issued to you for <strong>${driveTitle}</strong> at <strong>${companyName}</strong>.</p>
        <div class="info-box">
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Drive:</strong> ${driveTitle}</p>
            <p><strong>Offered CTC:</strong> ${salary} LPA</p>
            <p><strong>Joining Date:</strong> ${joiningDate ? new Date(joiningDate).toLocaleDateString() : "To be confirmed"}</p>
        </div>
        <p>Please log in to your dashboard to review and accept or reject the offer.</p>
        <p>Best regards,<br/>Placement Cell Team</p>
    `;
    return baseLayout(`Offer Letter: ${driveTitle}`, content);
}

function offerAcceptedTemplate({ officerName, studentName, driveTitle, salary }) {
    const content = `
        <h2>Candidate Accepted Offer</h2>
        <p>Hello ${officerName || "Placement Officer"},</p>
        <p>Candidate <strong>${studentName}</strong> has formally accepted the placement offer for <strong>${driveTitle}</strong>.</p>
        <div class="info-box">
            <p><strong>Student:</strong> ${studentName}</p>
            <p><strong>Drive:</strong> ${driveTitle}</p>
            <p><strong>Offered CTC:</strong> ${salary} LPA</p>
            <p><strong>Offer Status:</strong> Accepted ✅</p>
        </div>
        <p>Best regards,<br/>Placement System Notification</p>
    `;
    return baseLayout(`Offer Accepted by ${studentName}`, content);
}

function companyApprovedTemplate({ companyName, contactPerson }) {
    const content = `
        <h2>Company Account Approved</h2>
        <p>Hello ${contactPerson || companyName},</p>
        <p>Your company profile for <strong>${companyName}</strong> has been approved by the Placement Officer.</p>
        <div class="info-box">
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Approval Status:</strong> Approved ✅</p>
        </div>
        <p>You can now participate in recruitment drives organized by the college placement cell.</p>
        <p>Best regards,<br/>Placement Cell Team</p>
    `;
    return baseLayout(`Company Account Approved: ${companyName}`, content);
}

function passwordResetTemplate({ name, resetToken, resetLink }) {
    const link = resetLink || `#token=${resetToken}`;
    const content = `
        <h2>Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset your account password. Click the button below to set a new password:</p>
        <p><a href="${link}" class="btn">Reset Password</a></p>
        <div class="info-box">
            <p>If you did not request a password reset, please ignore this email.</p>
        </div>
        <p>Best regards,<br/>Placement Cell Team</p>
    `;
    return baseLayout("Password Reset Request", content);
}

module.exports = {
    welcomeTemplate,
    verificationTemplate,
    drivePublishedTemplate,
    applicationSubmittedTemplate,
    applicationShortlistedTemplate,
    applicationSelectedTemplate,
    applicationRejectedTemplate,
    offerReceivedTemplate,
    offerAcceptedTemplate,
    companyApprovedTemplate,
    passwordResetTemplate,
};
