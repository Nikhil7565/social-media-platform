import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import feedRoutes from './routes/feed.js';
import messagesRoutes from './routes/messages.js';
import notificationsRoutes from './routes/notifications.js';
import leaderboardRoutes from './routes/leaderboard.js';
import profileRoutes from './routes/profile.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/feed', feedRoutes);

// KINETIC REELS - HIGH PRIORITY BYPASS
import { db } from './db/index.js';
import { posts, users, likes, comments } from './db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';
app.get('/api/kinetic-reels', async (req, res) => {
  try {
    console.log('[KINETIC] Fetching reels from High Priority route...');
    const reelsPosts = await db.select({
      id: posts.id,
      videoUrl: posts.videoUrl,
      postType: posts.postType,
      caption: posts.caption,
      createdAt: posts.createdAt,
      user: {
        id: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
        xp: users.xp
      }
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.postType, 'reel'))
    .orderBy(desc(posts.createdAt))
    .limit(20);

    const augmented = await Promise.all(reelsPosts.map(async (p) => {
      const [lc] = await db.select({ c: sql<number>`count(*)` }).from(likes).where(eq(likes.postId, p.id));
      const [cc] = await db.select({ c: sql<number>`count(*)` }).from(comments).where(eq(comments.postId, p.id));
      return { ...p, likes: Number(lc?.c || 0), comments: Number(cc?.c || 0), hasLiked: false };
    }));

    res.json(augmented);
  } catch (e) {
    console.error('Bypass error:', e);
    res.status(500).json({ error: 'Sector inaccessible' });
  }
});

// REELS BYPASS (FORCE)
app.get('/api/feed/reels', async (req, res) => {
  try {
    console.log('[FORCE REELS] Bypassing router and fetching reels...');
    const reels = await db.select({
      id: posts.id,
      videoUrl: posts.videoUrl,
      postType: posts.postType,
      caption: posts.caption,
      createdAt: posts.createdAt,
      user: {
        id: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
        xp: users.xp
      }
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(eq(posts.postType, 'reel'))
    .orderBy(desc(posts.createdAt))
    .limit(20);
    
    res.json(reels);
  } catch (e) {
    res.status(500).json({ error: 'Bypass failed' });
  }
});

app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/profile', profileRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve frontend in production
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

app.get(/^.*$/, (req, res) => {
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

export default app;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}
