import express from 'express';
import type { Request, Response } from 'express';
import { db } from '../db/index.js';
import { posts, comments, likes, users, notifications } from '../db/schema.js';
import { authenticateToken, type AuthRequest } from '../middleware/auth.js';
import { eq, or, sql, desc, ne, and } from 'drizzle-orm';
import { XP_REWARDS } from '../utils/gamification.js';
import { createNotification, notifyAllOtherUsers, checkLevelUp, checkRankChange } from '../utils/notifications.js';
import { updateQuestProgress } from '../utils/quests.js';

const router = express.Router();

// Get following feed
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    
    // Fetch posts from users the current user follows (or all if no follows)
    // For now, returning all posts as a simple feed
    const feedPosts = await db.select({
      id: posts.id,
      caption: posts.caption,
      imageUrl: posts.imageUrl,
      videoUrl: posts.videoUrl,
      postType: posts.postType,
      themeName: posts.themeName,
      impactScore: posts.impactScore,
      createdAt: posts.createdAt,
      user: {
        id: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
        xp: users.xp
      },
      likes: sql<number>`(SELECT COUNT(*) FROM ${likes} WHERE ${likes.postId} = ${posts.id})`,
      comments: sql<number>`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.postId} = ${posts.id})`,
      hasLiked: sql<boolean>`EXISTS(SELECT 1 FROM ${likes} WHERE ${likes.postId} = ${posts.id} AND ${likes.userId} = ${userId})`,
      reactionType: sql<string>`(SELECT ${likes.type} FROM ${likes} WHERE ${likes.postId} = ${posts.id} AND ${likes.userId} = ${userId} LIMIT 1)`
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .orderBy(desc(posts.createdAt))
    .limit(50);

    res.json(feedPosts.map(p => ({
      ...p,
      likes: Number(p.likes),
      comments: Number(p.comments),
      hasLiked: Boolean(p.hasLiked)
    })));
  } catch (error) {
    console.error('Feed error:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// Get Trending / Breaking News (+ High Impact)
router.get('/trending', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const trendingPosts = await db.select({
      id: posts.id,
      caption: posts.caption,
      imageUrl: posts.imageUrl,
      videoUrl: posts.videoUrl,
      postType: posts.postType,
      themeName: posts.themeName,
      impactScore: posts.impactScore,
      createdAt: posts.createdAt,
      user: {
        id: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
        xp: users.xp
      },
      likes: sql<number>`(SELECT COUNT(*) FROM ${likes} WHERE ${likes.postId} = ${posts.id})`,
      comments: sql<number>`(SELECT COUNT(*) FROM ${comments} WHERE ${comments.postId} = ${posts.id})`,
      hasLiked: sql<boolean>`EXISTS(SELECT 1 FROM ${likes} WHERE ${likes.postId} = ${posts.id} AND ${likes.userId} = ${userId})`,
      reactionType: sql<string>`(SELECT ${likes.type} FROM ${likes} WHERE ${likes.postId} = ${posts.id} AND ${likes.userId} = ${userId} LIMIT 1)`
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .where(or(eq(posts.postType, 'news'), sql`${posts.impactScore} > 50`))
    .orderBy(desc(posts.impactScore), desc(posts.createdAt))
    .limit(20);

    res.json(trendingPosts.map(p => ({
      ...p,
      likes: Number(p.likes),
      comments: Number(p.comments),
      hasLiked: Boolean(p.hasLiked)
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending' });
  }
});


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

    // Reward XP - More XP for "Action" post types (Challenges/Help)
    const [user] = await db.select({ xp: users.xp }).from(users).where(eq(users.id, userId));
    const oldXp = user?.xp || 0;
    
    let reward = XP_REWARDS.POST;
    if (postType === 'challenge' || postType === 'help') {
        reward += XP_REWARDS.ACTION_POST_BONUS;
    }
    
    const newXp = oldXp + reward;
    
    await db.update(users).set({ xp: newXp }).where(eq(users.id, userId));
    await checkLevelUp(userId, oldXp, newXp);
    await checkRankChange(userId);

    // Global Notification
    await notifyAllOtherUsers(userId, 'new_post', newPost.id);

    // Update Quests
    const questSubType = (postType === 'challenge' || postType === 'help') ? 'POST_ACTION' : undefined;
    await updateQuestProgress(userId, 'POST', questSubType);



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
    const { type = 'like' } = req.body;

    // Check if already liked
    const [existing] = await db.select().from(likes).where(sql`${likes.postId} = ${postId} AND ${likes.userId} = ${userId}`);
    if (existing) {
      const alreadyLikedWithType = existing.type;
      await db.delete(likes).where(sql`${likes.postId} = ${postId} AND ${likes.userId} = ${userId}`);
      
      // If user clicked a DIFFERENT reaction, add the new one instead of just unliking
      if (alreadyLikedWithType !== type) {
          await db.insert(likes).values({ postId, userId, type });
          return res.json({ liked: true, type });
      }
      
      return res.json({ liked: false });
    }

    await db.insert(likes).values({ postId, userId, type });
    
    // Update Impact Score (+10 base, +25 for Bolt/Sparkle signals)
    const isHighValue = type === 'bolt' || type === 'sparkle';
    const scoreAdd = isHighValue ? 25 : 10;
    await db.update(posts).set({ impactScore: sql`${posts.impactScore} + ${scoreAdd}` }).where(eq(posts.id, postId));

    // Reward XP (+1 base, +5 for High Value signals)
    const [userRecord] = await db.select({ xp: users.xp }).from(users).where(eq(users.id, userId));
    const oldXp = userRecord?.xp || 0;
    
    let xpAdd = XP_REWARDS.LIKE;
    if (isHighValue) xpAdd += XP_REWARDS.HIGH_VALUE_REACTION;
    
    const newXp = oldXp + xpAdd;
    await db.update(users).set({ xp: newXp }).where(eq(users.id, userId));
    await checkLevelUp(userId, oldXp, newXp);
    await checkRankChange(userId);



    // Create notification for post owner
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    if (post && post.userId !== userId) {
      await createNotification(post.userId, userId, 'like', postId);
    }

    // Update Quests
    const questSubType = type === 'bolt' ? 'SIGNAL_BOLT' : undefined;
    await updateQuestProgress(userId, 'LIKE', questSubType);


    res.json({ liked: true, type });
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

    // Update Impact Score (+25 for comment)
    await db.update(posts).set({ impactScore: sql`${posts.impactScore} + 25` }).where(eq(posts.id, postId));

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

    // Update Quests
    await updateQuestProgress(userId, 'COMMENT');
    
    res.json(newComment);
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ error: 'Failed to comment' });
  }
});

// Get comments for a post
router.get('/:id/comments', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const postId = Number(req.params.id);
    
    const postComments = await db.select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      user: {
        id: users.id,
        username: users.username,
        avatarUrl: users.avatarUrl,
        xp: users.xp
      }
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt));

    res.json(postComments);
  } catch (error) {
    console.error('Fetch comments error:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
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
