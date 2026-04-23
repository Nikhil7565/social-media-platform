import { db } from '../db/index.js';
import { notifications, users, achievements } from '../db/schema.js';
import { eq, ne, desc, and } from 'drizzle-orm';
import { calculateLevel } from './gamification.js';

export const createNotification = async (userId: number, actorId: number, type: string, referenceId?: number, data?: number) => {
  try {
    await db.insert(notifications).values({
      userId,
      actorId,
      type,
      referenceId,
      data
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

export const notifyAllOtherUsers = async (actorId: number, type: string, referenceId?: number, data?: number) => {
  try {
    const allUsers = await db.select({ id: users.id }).from(users).where(ne(users.id, actorId));
    await Promise.all(allUsers.map(user => createNotification(user.id, actorId, type, referenceId, data)));
  } catch (error) {
    console.error('Failed to notify all users:', error);
  }
};

export const checkLevelUp = async (userId: number, oldXp: number, newXp: number) => {
  const oldLevel = calculateLevel(oldXp);
  const newLevel = calculateLevel(newXp);
  
  if (newLevel > oldLevel) {
    await createNotification(userId, userId, 'level_up', undefined, newLevel);
  }

  // Check for XP milestones
  const milestones = [1000, 5000, 10000, 50000];
  for (const m of milestones) {
    if (oldXp < m && newXp >= m) {
      // Award Milestone
      const existing = await db.select().from(achievements).where(
        and(eq(achievements.userId, userId), eq(achievements.type, 'xp_milestone'), eq(achievements.value, m))
      );
      if (existing.length === 0) {
        await db.insert(achievements).values({ userId, type: 'xp_milestone', value: m });
        await createNotification(userId, userId, 'milestone', undefined, m);
      }
    }
  }
};

export const checkRankChange = async (userId: number) => {
  try {
    // Check if user is now in top 5
    const topUsers = await db.select({ id: users.id })
      .from(users)
      .orderBy(desc(users.xp))
      .limit(5);
    
    const isTop5 = topUsers.some(u => u.id === userId);
    if (isTop5) {
      // Find current rank
      const rank = topUsers.findIndex(u => u.id === userId) + 1;
      
      // If they hit Rank 1, check for achievement
      if (rank === 1) {
        const existing = await db.select().from(achievements).where(
          and(eq(achievements.userId, userId), eq(achievements.type, 'rank_one'))
        );
        if (existing.length === 0) {
          await db.insert(achievements).values({ userId, type: 'rank_one', value: 1 });
        }
      }

      await createNotification(userId, userId, 'rank_change', undefined, rank);
    }
  } catch (error) {
    console.error('Failed to check rank change:', error);
  }
};

