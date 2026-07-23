module.exports = {
    testEnvironment: "node",
    verbose: true,
    collectCoverage: true,
    coverageDirectory: "coverage",
    testTimeout: 30000,
    collectCoverageFrom: [
        "src/**/*.js",
        "!src/config/db.js",
        "!src/email/transporter.js",
    ],
    coveragePathIgnorePatterns: [
        "/node_modules/",
        "/logs/",
        "/uploads/",
        "/coverage/",
    ],
    testPathIgnorePatterns: [
        "/node_modules/",
        "/logs/",
        "/uploads/",
        "/coverage/",
    ],
    setupFiles: ["<rootDir>/tests/env-setup.js"],
    setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
};
