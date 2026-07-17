function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof email === "string" && emailRegex.test(email.trim());
}

function validateCreateInput(req, res, next) {
    const { email, password, roll_number, full_name, phone, cgpa, backlogs, graduation_year } = req.body;

    if (!email || typeof email !== "string" || email.trim() === "") {
        return res.status(400).json({ message: "Email is required" });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }
    if (!password || typeof password !== "string" || password.trim() === "") {
        return res.status(400).json({ message: "Password is required" });
    }
    if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters long" });
    }
    if (!roll_number || typeof roll_number !== "string" || roll_number.trim() === "") {
        return res.status(400).json({ message: "Roll number is required" });
    }
    if (!full_name || typeof full_name !== "string" || full_name.trim() === "") {
        return res.status(400).json({ message: "Full name is required" });
    }
    if (full_name.trim().length > 100) {
        return res.status(400).json({ message: "Full name cannot exceed 100 characters" });
    }

    if (phone) {
        if (typeof phone !== "string" || phone.trim() === "") {
            return res.status(400).json({ message: "Phone must be a non-empty string" });
        }
        if (phone.trim().length > 15) {
            return res.status(400).json({ message: "Phone cannot exceed 15 characters" });
        }
    }

    const parsedCgpa = parseFloat(cgpa);
    if (isNaN(parsedCgpa) || parsedCgpa < 0.00 || parsedCgpa > 10.00) {
        return res.status(400).json({ message: "CGPA must be a number between 0.00 and 10.00" });
    }

    const parsedBacklogs = parseInt(backlogs, 10);
    if (isNaN(parsedBacklogs) || parsedBacklogs < 0) {
        return res.status(400).json({ message: "Backlogs cannot be negative" });
    }

    const parsedGradYear = parseInt(graduation_year, 10);
    if (isNaN(parsedGradYear) || parsedGradYear <= 0) {
        return res.status(400).json({ message: "Graduation year must be a valid positive integer" });
    }

    req.body.email = email.trim();
    req.body.roll_number = roll_number.trim();
    req.body.full_name = full_name.trim();
    req.body.phone = phone ? phone.trim() : null;
    req.body.cgpa = parsedCgpa;
    req.body.backlogs = parsedBacklogs;
    req.body.graduation_year = parsedGradYear;

    next();
}

function validateUpdateInput(req, res, next) {
    const { email, full_name, phone, cgpa, backlogs, graduation_year } = req.body;

    if (!email || typeof email !== "string" || email.trim() === "") {
        return res.status(400).json({ message: "Email is required" });
    }
    if (!isValidEmail(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }
    if (!full_name || typeof full_name !== "string" || full_name.trim() === "") {
        return res.status(400).json({ message: "Full name is required" });
    }
    if (full_name.trim().length > 100) {
        return res.status(400).json({ message: "Full name cannot exceed 100 characters" });
    }

    if (phone) {
        if (typeof phone !== "string" || phone.trim() === "") {
            return res.status(400).json({ message: "Phone must be a non-empty string" });
        }
        if (phone.trim().length > 15) {
            return res.status(400).json({ message: "Phone cannot exceed 15 characters" });
        }
    }

    const parsedCgpa = parseFloat(cgpa);
    if (isNaN(parsedCgpa) || parsedCgpa < 0.00 || parsedCgpa > 10.00) {
        return res.status(400).json({ message: "CGPA must be a number between 0.00 and 10.00" });
    }

    const parsedBacklogs = parseInt(backlogs, 10);
    if (isNaN(parsedBacklogs) || parsedBacklogs < 0) {
        return res.status(400).json({ message: "Backlogs cannot be negative" });
    }

    const parsedGradYear = parseInt(graduation_year, 10);
    if (isNaN(parsedGradYear) || parsedGradYear <= 0) {
        return res.status(400).json({ message: "Graduation year must be a valid positive integer" });
    }

    req.body.email = email.trim();
    req.body.full_name = full_name.trim();
    req.body.phone = phone ? phone.trim() : null;
    req.body.cgpa = parsedCgpa;
    req.body.backlogs = parsedBacklogs;
    req.body.graduation_year = parsedGradYear;

    next();
}

function validateStudentId(req, res, next) {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid student ID. Must be a positive integer." });
    }
    next();
}

module.exports = {
    validateCreateInput,
    validateUpdateInput,
    validateStudentId,
};
