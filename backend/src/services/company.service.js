const companyModel = require("../models/company.model");

async function getAllCompanies() {
    return await companyModel.getAllCompanies();
}

async function getPendingCompanies() {
    return await companyModel.getPendingCompanies();
}

async function getCompanyById(companyId) {
    const company = await companyModel.getCompanyById(companyId);
    if (!company) {
        const error = new Error("Company profile not found");
        error.statusCode = 404;
        throw error;
    }
    return company;
}

async function approveCompany(companyId, officerId) {
    const company = await companyModel.getCompanyById(companyId);
    if (!company) {
        const error = new Error("Company profile not found");
        error.statusCode = 404;
        throw error;
    }

    if (company.is_approved) {
        const error = new Error("Company is already approved");
        error.statusCode = 409;
        throw error;
    }

    const approvedCompany = await companyModel.approveCompany(companyId, officerId);

    // Send Company Approved Email
    const emailService = require("./email.service");
    try {
        const recipientEmail = company.contact_email || company.account_email;
        if (recipientEmail) {
            await emailService.sendCompanyApprovedEmail(recipientEmail, {
                companyName: company.name,
                contactPerson: company.contact_person,
            });
        }
    } catch (err) {
        console.error("Email Error:", err.message);
    }

    return approvedCompany;
}

async function rejectCompany(companyId) {
    const company = await companyModel.getCompanyById(companyId);
    if (!company) {
        const error = new Error("Company profile not found");
        error.statusCode = 404;
        throw error;
    }

    return await companyModel.rejectCompany(companyId);
}

module.exports = {
    getAllCompanies,
    getPendingCompanies,
    getCompanyById,
    approveCompany,
    rejectCompany,
};
