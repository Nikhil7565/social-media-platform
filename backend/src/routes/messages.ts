import express from 'express';
import type { Request, Response } from 'express';
import { db } from '../db/index.js';
import { messages, streaks, users, notifications } from '../db/schema.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { eq, or, and, sql, desc } from 'drizzle-orm';
import { XP_REWARDS, calculateLevel } from '../utils/gamification.js';
import { createNotification, checkLevelUp, checkRankChange } from '../utils/notifications.js';
import { getAIResponse } from '../utils/ai.js';


const router = express.Router();

// Get Conversations (Chat List)
router.get('/conversations', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    
    // Fetch streaks involving the user
    const userStreaks = await db.select()
      .from(streaks)
      .where(or(eq(streaks.user1Id, userId), eq(streaks.user2Id, userId)))
      .orderBy(desc(streaks.lastMessageAt));

    // Get the other users' info
    const conversations = [];
    for (const streak of userStreaks) {
      const otherUserId = streak.user1Id === userId ? streak.user2Id : streak.user1Id;
      const [otherUser] = await db.select({ id: users.id, username: users.username, avatarUrl: users.avatarUrl, xp: users.xp })
        .from(users).where(eq(users.id, otherUserId));
      
      if (otherUser) {
        conversations.push({
          id: streak.id,
          streakCount: streak.streakCount,
          lastMessageAt: streak.lastMessageAt,
          user: otherUser
        });
      }
    }
    
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Get Messages with specific user
router.get('/:otherUserId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const otherUserId = Number(req.params.otherUserId);

    const msgs = await db.select()
      .from(messages)
      .where(or(
        and(eq(messages.senderId, userId), eq(messages.receiverId, otherUserId)),
        and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId))
      ))
      .orderBy(messages.createdAt);
      
    // Fetch streak info
    const [streak] = await db.select().from(streaks)
      .where(or(
        and(eq(streaks.user1Id, userId), eq(streaks.user2Id, otherUserId)),
        and(eq(streaks.user1Id, otherUserId), eq(streaks.user2Id, userId))
      ));

    const [otherUser] = await db.select({ id: users.id, username: users.username, xp: users.xp, avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, otherUserId));
    if (!otherUser) return res.status(404).json({ error: 'User not found' });

    // Mark incoming messages as read
    await db.update(messages)
      .set({ isRead: 1 })
      .where(and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId)));

    res.json({ messages: msgs, streak: streak || { streakCount: 0 }, otherUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

// Send Message (+2 XP, update streak)
router.post('/:otherUserId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const otherUserId = Number(req.params.otherUserId);
    const { content, imageUrl } = req.body;
    
    if (!content && !imageUrl) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }
 
    const [newMsg] = await db.insert(messages).values({
      senderId: userId,
      receiverId: otherUserId,
      content: content || '',
      imageUrl: imageUrl || null
    }).returning();

    if (!newMsg) throw new Error('Failed to send message');

    // Reward XP and check Level Up
    const [userRecord] = await db.select({ xp: users.xp }).from(users).where(eq(users.id, userId));
    const oldXp = userRecord?.xp || 0;
    const newXp = oldXp + XP_REWARDS.MESSAGE;
    await db.update(users).set({ xp: newXp }).where(eq(users.id, userId));
    await checkLevelUp(userId, oldXp, newXp);
    await checkRankChange(userId);

    // Notify receiver of new message
    await createNotification(otherUserId, userId, 'message', newMsg.id);

    // Handle Streak Logic
    let [streak] = await db.select().from(streaks).where(or(
      and(eq(streaks.user1Id, userId), eq(streaks.user2Id, otherUserId)),
      and(eq(streaks.user1Id, otherUserId), eq(streaks.user2Id, userId))
    ));

    const now = new Date();
    if (!streak) {
      [streak] = await db.insert(streaks).values({
        user1Id: Math.min(userId, otherUserId),
        user2Id: Math.max(userId, otherUserId),
        streakCount: 0,
        lastMessageAt: now.toISOString()
      }).returning();
    } else {
      // If within 24 hours, count increment?
      // Real streak logic requires BOTH sides replying within 24 hours. For simulation, any message within 24 hrs resets timer.
      // E.g. streakCount logic -> increment if day changed 
      // Simplified: Just add 1 to streak every time.
      const msSinceLast = now.getTime() - new Date(streak.lastMessageAt!).getTime();
      
      let newCount = streak.streakCount;
      if (msSinceLast > 24 * 60 * 60 * 1000) {
        // Broke streak
        newCount = 1;
      } else {
        newCount += 1;
      }

      await db.update(streaks)
        .set({ streakCount: newCount, lastMessageAt: now.toISOString() })
        .where(eq(streaks.id, streak.id));
        
      if (newCount > streak.streakCount && newCount % 5 === 0) {
        // Milestone reward
        await createNotification(userId, otherUserId, 'streak', streak.id, newCount);
        await createNotification(otherUserId, userId, 'streak', streak.id, newCount);
      }
    }


    // AI AUTO-RESPONSE LOGIC
    const [receiver] = await db.select({ username: users.username }).from(users).where(eq(users.id, otherUserId));
    if (receiver && receiver.username === 'Kinetic AI') {
        // Simulate thinking time
        setTimeout(async () => {
            const aiText = getAIResponse(content || "");
            await db.insert(messages).values({
                senderId: otherUserId, // AI is sender
                receiverId: userId,    // User is receiver
                content: aiText,
                isRead: 0
            });

            // Optional: Reward user for interacting with AI
            await db.update(users).set({ xp: sql`${users.xp} + 5` }).where(eq(users.id, userId));
            await createNotification(userId, otherUserId, 'message', 0); // Notify user of AI reply
        }, 1000);
    }

    res.json(newMsg);
  } catch (error) {
    console.error('Message error:', error);
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
