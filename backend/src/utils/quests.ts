import { db } from '../db/index.js';
import { userQuests, quests } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';

export const updateQuestProgress = async (userId: number, type: 'POST' | 'LIKE' | 'COMMENT' | 'STREAK', subType?: string) => {
    try {
        const date = new Date().toISOString().split('T')[0]!;
        
        // Find if user has a quest of this type today
        const userMissions = await db.select({
            id: quests.id,
            target: quests.target,
            progress: userQuests.progress,
            isCompleted: userQuests.isCompleted
        })
        .from(userQuests)
        .innerJoin(quests, eq(userQuests.questId, quests.id))
        .where(and(
            eq(userQuests.userId, userId),
            eq(userQuests.date, date),
            eq(quests.type, type),
            subType ? eq(quests.id, subType) : sql`1=1`, // If subtype provided, match specific quest ID
            eq(userQuests.isCompleted, false)
        ));

        for (const mission of userMissions) {
            const newProgress = mission.progress + 1;
            const isCompleted = newProgress >= mission.target;

            await db.update(userQuests)
                .set({ 
                    progress: newProgress,
                    isCompleted
                })
                .where(and(
                    eq(userQuests.userId, userId),
                    eq(userQuests.questId, mission.id),
                    eq(userQuests.date, date)
                ));
        }
    } catch (error) {
        console.error('Quest progress update error:', error);
    }
};
