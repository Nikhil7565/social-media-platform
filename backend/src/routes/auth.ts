import express from 'express';
import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { users, posts, streaks, notifications, messages } from '../db/schema.js';
import { eq, or, and, sql } from 'drizzle-orm';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [user] = await db.insert(users).values({
      username,
      email,
      passwordHash: hashedPassword,
    }).returning();

    if (!user) {
      return res.status(400).json({ error: 'Registration failed - no user returned' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret123');
    res.json({ token, user: { id: user.id, username: user.username, xp: user.xp } });
  } catch (error: any) {
    console.error('Registration error:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE' || error.message?.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    res.status(400).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET || 'secret123');
    res.json({ token, user: { id: user.id, username: user.username, xp: user.xp, avatarUrl: user.avatarUrl } });
  } catch (error) {
    res.status(400).json({ error: 'Login failed' });
  }
});

router.get('/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    // Fetch all stats in parallel
    const [
      [user],
      [postsCount],
      [streaksCount],
      [alertsCount],
      [unreadMsgCount]
    ] = await Promise.all([
      db.select().from(users).where(eq(users.id, userId)),
      db.select({ count: sql<number>`count(*)` }).from(posts).where(eq(posts.userId, userId)),
      db.select({ count: sql<number>`count(*)` }).from(streaks).where(
        and(
          or(eq(streaks.user1Id, userId), eq(streaks.user2Id, userId)),
          sql`${streaks.streakCount} > 0`
        )
      ),
      db.select({ count: sql<number>`count(*)` }).from(notifications).where(and(eq(notifications.userId, userId), eq(notifications.isRead, false))),
      db.select({ count: sql<number>`count(*)` }).from(messages).where(and(eq(messages.receiverId, userId), eq(messages.isRead, 0)))
    ]);

    const xp = user?.xp || 0;

    res.json({
      posts: Number(postsCount?.count ?? 0),
      xp,
      streaks: Number(streaksCount?.count ?? 0),
      alerts: Number(alertsCount?.count ?? 0),
      unreadMessages: Number(unreadMsgCount?.count ?? 0)
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
