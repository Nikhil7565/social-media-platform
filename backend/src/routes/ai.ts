import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { getAISuggestion } from '../utils/ai.js';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

// GET AI user info (ID, etc)
router.get('/info', authenticateToken, async (req, res) => {
    try {
        const [aiUser] = await db.select({ id: users.id, avatarUrl: users.avatarUrl })
            .from(users)
            .where(eq(users.username, 'Kinetic AI'));
        res.json(aiUser || { id: 1 }); // Fallback to 1
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

// GET AI-powered post suggestions
router.get('/suggest', authenticateToken, (req, res) => {
    try {
        const suggestion = getAISuggestion();
        res.json(suggestion);
    } catch (error) {
        res.status(500).json({ error: 'Failed to get AI suggestion' });
    }
});

export default router;
