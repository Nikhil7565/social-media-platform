import express from 'express';
import type { Request, Response } from 'express';
import { db } from '../db/index.js';
import { posts, comments, likes, users, notifications } from '../db/schema.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { eq, or, sql, desc, ne, and } from 'drizzle-orm';
import { XP_REWARDS } from '../utils/gamification.js';
import { createNotification, notifyAllOtherUsers, checkLevelUp, checkRankChange } from '../utils/notifications.js';

const router = express.Router();

// DEBUG PING
router.get('/ping', (req, res) => {
  res.send('FEED_ALIVE');
});

// Get Reels Only (V1.1 - Priority)
router.get('/reels', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log(`[REELS V1.1] User ${req.user!.id} requested reels...`);
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

    console.log(`[REELS] Found ${reelsPosts.length} reels in DB.`);

    const augmentedReels = await Promise.all(reelsPosts.map(async (p) => {
      const [likeCount] = await db.select({ count: sql<number>`count(*)` }).from(likes).where(eq(likes.postId, p.id));
      const [commentCount] = await db.select({ count: sql<number>`count(*)` }).from(comments).where(eq(comments.postId, p.id));
      const hasLiked = await db.select().from(likes).where(sql`${likes.postId} = ${p.id} AND ${likes.userId} = ${req.user!.id}`);

      return {
        ...p,
        likes: Number(likeCount?.count ?? 0),
        comments: Number(commentCount?.count ?? 0),
        hasLiked: hasLiked.length > 0
      };
    }));

    res.json(augmentedReels);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reels' });
  }
});

// Get Feed
router.get('/', authenticateToken, async (req: AuthRequest, res) => {

// Create Post (+10 XP)
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { caption, imageUrl, videoUrl, postType, themeName } = req.body;
    const userId = req.user!.id;

    const [newPost] = await db.insert(posts).values({
      userId,
      caption,
      imageUrl,
      videoUrl,
      postType: postType || 'text',
      themeName
    }).returning();

    if (!newPost) throw new Error('Post creation failed');

    // Reward XP
    const [user] = await db.select({ xp: users.xp }).from(users).where(eq(users.id, userId));
    const oldXp = user?.xp || 0;
    const newXp = oldXp + XP_REWARDS.POST;
    
    await db.update(users).set({ xp: newXp }).where(eq(users.id, userId));
    await checkLevelUp(userId, oldXp, newXp);
    await checkRankChange(userId);

    // Global Notification
    await notifyAllOtherUsers(userId, 'new_post', newPost.id);

    res.json(newPost);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Like a post
router.post('/:id/like', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const postId = Number(req.params.id);
    const userId = req.user!.id;

    // Check if already liked
    const existing = await db.select().from(likes).where(sql`${likes.postId} = ${postId} AND ${likes.userId} = ${userId}`);
    if (existing.length > 0) {
      await db.delete(likes).where(sql`${likes.postId} = ${postId} AND ${likes.userId} = ${userId}`);
      return res.json({ liked: false });
    }

    await db.insert(likes).values({ postId, userId });
    
    // Reward XP and check Level Up
    const [userRecord] = await db.select({ xp: users.xp }).from(users).where(eq(users.id, userId));
    const oldXp = userRecord?.xp || 0;
    const newXp = oldXp + XP_REWARDS.LIKE;
    await db.update(users).set({ xp: newXp }).where(eq(users.id, userId));
    await checkLevelUp(userId, oldXp, newXp);
    await checkRankChange(userId);

    // Create notification for post owner
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    if (post && post.userId !== userId) {
      await createNotification(post.userId, userId, 'like', postId);
    }

    res.json({ liked: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Comment (+5 XP)
router.post('/:id/comment', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const postId = Number(req.params.id);
    const userId = req.user!.id;
    const { content } = req.body;

    const [newComment] = await db.insert(comments).values({
      postId,
      userId,
      content
    }).returning();

    if (!newComment) throw new Error('Comment creation failed');

    // Reward XP and check Level Up
    const [userRecord] = await db.select({ xp: users.xp }).from(users).where(eq(users.id, userId));
    const oldXp = userRecord?.xp || 0;
    const newXp = oldXp + XP_REWARDS.COMMENT;
    await db.update(users).set({ xp: newXp }).where(eq(users.id, userId));
    await checkLevelUp(userId, oldXp, newXp);
    await checkRankChange(userId);

    // Notification
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    if (post && post.userId !== userId) {
      await createNotification(post.userId, userId, 'comment', postId);
    }
    
    res.json(newComment);
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ error: 'Failed to comment' });
  }
});

// Share (+2 XP)
router.post('/:id/share', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    await db.update(users).set({ xp: sql`${users.xp} + ${XP_REWARDS.SHARE}` }).where(eq(users.id, userId));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to share' });
  }
});

// Delete Post
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const postId = Number(req.params.id);
    const userId = req.user!.id;
    console.log(`[DELETE] User ${userId} attempting to delete post ${postId}`);

    // Verify ownership
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    if (!post) {
      console.log(`[DELETE] Post ${postId} not found`);
      return res.status(404).json({ error: 'Post not found' });
    }
    if (post.userId !== userId) {
      console.log(`[DELETE] User ${userId} does not own post ${postId}`);
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Cleanup associated data
    console.log(`[DELETE] Cleaning up likes/comments for post ${postId}`);
    await db.delete(likes).where(eq(likes.postId, postId));
    await db.delete(comments).where(eq(comments.postId, postId));
    
    // Cleanup notifications involving this post
    console.log(`[DELETE] Cleaning up notifications for post ${postId}`);
    await db.delete(notifications).where(
      and(
        eq(notifications.referenceId, postId),
        or(eq(notifications.type, 'like'), eq(notifications.type, 'comment'))
      )
    );

    // Delete post
    console.log(`[DELETE] Removing post ${postId}`);
    await db.delete(posts).where(eq(posts.id, postId));

    console.log(`[DELETE] Successfully deleted post ${postId}`);
    res.json({ success: true });
  } catch (error) {
    console.error('[DELETE] Error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;
