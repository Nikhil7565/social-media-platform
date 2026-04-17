import { db } from '../db/index.js';
import { notifications, users } from '../db/schema.js';
import { eq, ne, desc } from 'drizzle-orm';
import { calculateLevel } from './gamification.js';
export const createNotification = async (userId, actorId, type, referenceId, data) => {
    try {
        await db.insert(notifications).values({
            userId,
            actorId,
            type,
            referenceId,
            data
        });
    }
    catch (error) {
        console.error('Failed to create notification:', error);
    }
};
export const notifyAllOtherUsers = async (actorId, type, referenceId, data) => {
    try {
        const allUsers = await db.select({ id: users.id }).from(users).where(ne(users.id, actorId));
        for (const user of allUsers) {
            await createNotification(user.id, actorId, type, referenceId, data);
        }
    }
    catch (error) {
        console.error('Failed to notify all users:', error);
    }
};
export const checkLevelUp = async (userId, oldXp, newXp) => {
    const oldLevel = calculateLevel(oldXp);
    const newLevel = calculateLevel(newXp);
    if (newLevel > oldLevel) {
        await createNotification(userId, userId, 'level_up', undefined, newLevel);
    }
};
export const checkRankChange = async (userId) => {
    try {
        // Check if user is now in top 5
        const topUsers = await db.select({ id: users.id })
            .from(users)
            .orderBy(desc(users.xp))
            .limit(5);
        const isTop5 = topUsers.some(u => u.id === userId);
        if (isTop5) {
            // Find current rank
            const rank = topUsers.findIndex(u => u.id === userId) + 1;
            // Simplified: Only notify if they hit exactly Rank 1, 2, or 3 for the first time in this session?
            // Better: Just notify "You are now Rank X!"
            await createNotification(userId, userId, 'rank_change', undefined, rank);
        }
    }
    catch (error) {
        console.error('Failed to check rank change:', error);
    }
};
//# sourceMappingURL=notifications.js.map