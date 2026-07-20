const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "../../uploads/resumes");

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const studentId = req.user ? req.user.id : "student";
        const timestamp = Math.floor(Date.now() / 1000);
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `${studentId}_${timestamp}${ext}`;
        cb(null, filename);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedExtensions = [".pdf", ".doc", ".docx"];
    const allowedMimeTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;

    if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(mimeType)) {
        cb(null, true);
    } else {
        const error = new Error("Invalid file format. Only PDF, DOC, and DOCX files are allowed.");
        error.statusCode = 400;
        cb(error, false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },
    fileFilter: fileFilter,
});

function uploadResumeMiddleware(req, res, next) {
    const singleUpload = upload.single("resume");

    singleUpload(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    success: false,
                    message: "File size exceeds the 5 MB limit.",
                });
            }
            return res.status(400).json({
                success: false,
                message: err.message,
            });
        } else if (err) {
            return res.status(err.statusCode || 400).json({
                success: false,
                message: err.message,
            });
        }
        next();
    });
}

module.exports = uploadResumeMiddleware;
