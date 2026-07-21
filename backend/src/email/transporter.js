const nodemailer = require("nodemailer");

const mailHost = process.env.MAIL_HOST || "smtp.gmail.com";
const mailPort = parseInt(process.env.MAIL_PORT, 10) || 587;
const mailSecure = process.env.MAIL_SECURE === "true";
const mailUser = process.env.MAIL_USER || "";
const mailPassword = process.env.MAIL_PASSWORD || "";
const defaultFrom = process.env.MAIL_FROM || '"Placement Cell" <no-reply@placementcell.edu>';

const transporter = nodemailer.createTransport({
    host: mailHost,
    port: mailPort,
    secure: mailSecure,
    auth: {
        user: mailUser,
        pass: mailPassword,
    },
    tls: {
        rejectUnauthorized: false,
    },
});

module.exports = {
    transporter,
    defaultFrom,
};
