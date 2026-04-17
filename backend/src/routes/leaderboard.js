import express from 'express';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { desc } from 'drizzle-orm';
const router = express.Router();
router.get('/', async (req, res) => {
    try {
        const topUsers = await db.select({
            id: users.id,
            username: users.username,
            avatarUrl: users.avatarUrl,
            xp: users.xp
        })
            .from(users)
            .orderBy(desc(users.xp))
            .limit(50);
        res.json(topUsers);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});
export default router;
//# sourceMappingURL=leaderboard.js.map