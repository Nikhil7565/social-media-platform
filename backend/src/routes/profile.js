import express from 'express';
import { db } from '../db/index.js';
import { users, posts, likes, comments, streaks } from '../db/schema.js';
import { authenticateToken } from '../middleware/auth.js';
import { eq, or, and, like, not, sql, desc } from 'drizzle-orm';
const router = express.Router();
// SEARCH Users
router.get('/search', authenticateToken, async (req, res) => {
    try {
        const q = req.query.q;
        const userId = req.user.id;
        if (!q)
            return res.json([]);
        const results = await db.select({
            id: users.id,
            username: users.username,
            avatarUrl: users.avatarUrl,
            xp: users.xp
        })
            .from(users)
            .where(and(like(users.username, `%${q}%`), not(eq(users.id, userId))))
            .limit(10);
        res.json(results);
    }
    catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});
// GET /api/profile/:userId  (or /api/profile/me)
router.get('/:userId', authenticateToken, async (req, res) => {
    try {
        const rawId = req.params.userId;
        const userId = rawId === 'me' ? req.user.id : Number(rawId);
        console.log(`[PROFILE] Fetching profile for ${rawId} (Resolved ID: ${userId})`);
        const [user] = await db.select({
            id: users.id,
            username: users.username,
            avatarUrl: users.avatarUrl,
            bio: users.bio,
            xp: users.xp,
            createdAt: users.createdAt,
        }).from(users).where(eq(users.id, userId));
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        // Post count
        const [postCount] = await db.select({ count: sql `count(*)` })
            .from(posts).where(eq(posts.userId, userId));
        // Streak count
        const [streakCount] = await db.select({ count: sql `count(*)` })
            .from(streaks).where(or(eq(streaks.user1Id, userId), eq(streaks.user2Id, userId)));
        // Last 9 posts for grid
        const userPosts = await db.select().from(posts)
            .where(eq(posts.userId, userId))
            .orderBy(desc(posts.createdAt))
            .limit(9);
        res.json({
            ...user,
            postCount: Number(postCount?.count ?? 0),
            streakCount: Number(streakCount?.count ?? 0),
            level: Math.floor(Math.sqrt((user.xp || 0) / 50)),
            posts: userPosts,
        });
    }
    catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Failed to load profile' });
    }
});
// PUT /api/profile - Update current user profile
router.put('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { avatarUrl, bio } = req.body;
        await db.update(users).set({
            avatarUrl: avatarUrl !== undefined ? avatarUrl : undefined,
            bio: bio !== undefined ? bio : undefined
        }).where(eq(users.id, userId));
        const [updatedUser] = await db.select({
            id: users.id,
            username: users.username,
            avatarUrl: users.avatarUrl,
            bio: users.bio
        }).from(users).where(eq(users.id, userId));
        res.json(updatedUser);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});
export default router;
//# sourceMappingURL=profile.js.map