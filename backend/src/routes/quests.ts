import express from 'express';
import { db } from '../db/index.js';
import { users, quests, userQuests, notifications } from '../db/schema.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { eq, and, sql } from 'drizzle-orm';

const router = express.Router();

const DAILY_QUESTS = [
  { id: 'POST_1', title: 'Galactic Broadcast', description: 'Share 1 post in the sector', rewardXp: 50, type: 'POST', target: 1 },
  { id: 'LIKE_5', title: 'Neural Surge', description: 'Send 5 neural pulses (likes)', rewardXp: 30, type: 'LIKE', target: 5 },
  { id: 'COMMENT_3', title: 'Data Transmission', description: 'Leave 3 transmissions (comments)', rewardXp: 40, type: 'COMMENT', target: 3 },
  { id: 'STREAK_1', title: 'Void Sync', description: 'Maintain or start 1 chat streak', rewardXp: 60, type: 'STREAK', target: 1 },
];

// Ensure daily quests exist in the main quests table
const seedQuests = async () => {
    for (const q of DAILY_QUESTS) {
        await db.insert(quests).values(q).onConflictDoNothing();
    }
};
seedQuests();

router.get('/daily', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const date = new Date().toISOString().split('T')[0]!;

    // Get current quests for user
    let userMissions = await db.select({
        id: quests.id,
        title: quests.title,
        description: quests.description,
        rewardXp: quests.rewardXp,
        progress: userQuests.progress,
        target: quests.target,
        isCompleted: userQuests.isCompleted,
        isClaimed: userQuests.isClaimed
    })
    .from(userQuests)
    .innerJoin(quests, eq(userQuests.questId, quests.id))
    .where(and(eq(userQuests.userId, userId), eq(userQuests.date, date)));

    // If no quests for today, pick 3 random ones
    if (userMissions.length === 0) {
        const shuffled = [...DAILY_QUESTS].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 3);
        
        for (const q of selected) {
            await db.insert(userQuests).values({
                userId,
                questId: q.id,
                date,
                progress: 0,
            });
        }

        userMissions = selected.map(q => ({
            ...q,
            progress: 0,
            isCompleted: false,
            isClaimed: false
        }));
    }

    res.json(userMissions);
  } catch (error) {
    console.error('Quests fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch quests' });
  }
});

router.post('/claim/:questId', authenticateToken, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.id;
        const questId = req.params.questId!;
        const date = new Date().toISOString().split('T')[0]!;

        const [mission] = await db.select({
            isCompleted: userQuests.isCompleted,
            isClaimed: userQuests.isClaimed,
            rewardXp: quests.rewardXp
        })
        .from(userQuests)
        .innerJoin(quests, eq(userQuests.questId, quests.id))
        .where(and(
            eq(userQuests.userId, userId),
            eq(userQuests.questId, questId),
            eq(userQuests.date, date)
        ));

        if (!mission || !mission.isCompleted || mission.isClaimed) {
            return res.status(400).json({ error: 'Cannot claim this reward' });
        }

        // Apply XP and mark as claimed
        await db.transaction(async (tx) => {
            await tx.update(users)
                .set({ xp: sql`${users.xp} + ${mission.rewardXp}` })
                .where(eq(users.id, userId));

            await tx.update(userQuests)
                .set({ isClaimed: true })
                .where(and(
                    eq(userQuests.userId, userId),
                    eq(userQuests.questId, questId),
                    eq(userQuests.date, date)
                ));
            
            await tx.insert(notifications).values({
                userId,
                type: 'milestone',
                actorId: 1, // System
                referenceId: 0,
                data: mission.rewardXp,
                isRead: false
            });
        });

        res.json({ success: true, rewardXp: mission.rewardXp });
    } catch (error) {
        res.status(500).json({ error: 'Failed to claim reward' });
    }
});

export default router;
