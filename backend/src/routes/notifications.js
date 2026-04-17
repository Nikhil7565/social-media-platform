import express from 'express';
import { db } from '../db/index.js';
import { notifications, users } from '../db/schema.js';
import { authenticateToken } from '../middleware/auth.js';
import { eq, desc } from 'drizzle-orm';
const router = express.Router();
router.get('/', authenticateToken, async (req, res) => {
    try {
        const notifs = await db.select({
            id: notifications.id,
            type: notifications.type,
            referenceId: notifications.referenceId,
            data: notifications.data,
            isRead: notifications.isRead,
            createdAt: notifications.createdAt,
            actor: {
                username: users.username,
                avatarUrl: users.avatarUrl
            }
        })
            .from(notifications)
            .innerJoin(users, eq(notifications.actorId, users.id))
            .where(eq(notifications.userId, req.user.id))
            .orderBy(desc(notifications.createdAt));
        res.json(notifs);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});
router.delete('/clear', authenticateToken, async (req, res) => {
    try {
        await db.delete(notifications).where(eq(notifications.userId, req.user.id));
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to clear notifications' });
    }
});
router.post('/read', authenticateToken, async (req, res) => {
    try {
        await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, req.user.id));
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});
export default router;
//# sourceMappingURL=notifications.js.map