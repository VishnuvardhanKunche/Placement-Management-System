const pool = require("../config/db");
const notificationModel = require("../models/notification.model");

// Reusable safe helper to create a single notification
async function createNotification(
    recipientUserId,
    title,
    message,
    notificationType = "info",
    referenceType = null,
    referenceId = null
) {
    try {
        return await notificationModel.createNotification(
            recipientUserId,
            title,
            message,
            notificationType,
            referenceType,
            referenceId
        );
    } catch (error) {
        console.error(`[Notification Trigger Error] Failed to send notification to user ${recipientUserId}:`, error);
        return null;
    }
}

// Reusable safe helper to send a notification to all active users matching a role
async function notifyUsersByRole(
    role,
    title,
    message,
    notificationType = "info",
    referenceType = null,
    referenceId = null
) {
    try {
        const userIds = await notificationModel.getAllUserIdsByRole(role);
        for (const userId of userIds) {
            await createNotification(
                userId,
                title,
                message,
                notificationType,
                referenceType,
                referenceId
            );
        }
    } catch (error) {
        console.error(`[Notification Trigger Error] Failed to send bulk notifications to role ${role}:`, error);
    }
}

// Reusable safe helper to notify eligible students when a placement drive is published
async function notifyEligibleStudentsForDrive(driveId, title, companyName, eligibleDepartmentIds = []) {
    try {
        let query = `SELECT s.user_id, s.full_name, u.email FROM students s JOIN users u ON s.user_id = u.id WHERE s.is_verified = TRUE`;
        let params = [];
        if (eligibleDepartmentIds && eligibleDepartmentIds.length > 0) {
            query += ` AND s.department_id = ANY($1::int[])`;
            params.push(eligibleDepartmentIds);
        }
        const result = await pool.query(query, params);
        const emailService = require("./email.service");
        for (const row of result.rows) {
            await createNotification(
                row.user_id,
                "New Placement Drive Published",
                `${companyName || "A company"} published a new drive: ${title}`,
                "drive",
                "drive",
                driveId
            );

            // Send Drive Published Email
            try {
                await emailService.sendDrivePublishedEmail(row.email, {
                    name: row.full_name,
                    driveTitle: title,
                    companyName: companyName,
                });
            } catch (err) {
                console.error("Email Error:", err.message);
            }
        }
    } catch (error) {
        console.error("[Notification Trigger Error] Failed to notify eligible students for drive:", error);
    }
}

async function getUserNotifications(userId) {
    return await notificationModel.getNotificationsByRecipient(userId);
}

async function getUnreadNotifications(userId) {
    const notifications = await notificationModel.getUnreadNotificationsByRecipient(userId);
    return {
        unread_count: notifications.length,
        notifications: notifications,
    };
}

async function markAsRead(id, userId) {
    const notification = await notificationModel.getNotificationById(id);
    if (!notification || notification.recipient_user_id !== userId) {
        const error = new Error("Notification not found");
        error.statusCode = 404;
        throw error;
    }

    return await notificationModel.markAsRead(id, userId);
}

async function markAllAsRead(userId) {
    const count = await notificationModel.markAllAsRead(userId);
    return {
        count: count,
    };
}

async function deleteNotification(id, userId) {
    const notification = await notificationModel.getNotificationById(id);
    if (!notification || notification.recipient_user_id !== userId) {
        const error = new Error("Notification not found");
        error.statusCode = 404;
        throw error;
    }

    return await notificationModel.deleteNotification(id, userId);
}

module.exports = {
    createNotification,
    notifyUsersByRole,
    notifyEligibleStudentsForDrive,
    getUserNotifications,
    getUnreadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
};
