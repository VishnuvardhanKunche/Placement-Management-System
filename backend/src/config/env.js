const requiredEnvVars = [
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
    "JWT_SECRET",
];

function validateEnv() {
    const missingVars = [];
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            missingVars.push(envVar);
        }
    }

    if (missingVars.length > 0) {
        console.error(
            `\x1b[31m[Critical Error] Startup failed. The following required environment variables are missing: ${missingVars.join(
                ", "
            )}\x1b[0m`
        );
        process.exit(1);
    }
}

module.exports = {
    validateEnv,
};
