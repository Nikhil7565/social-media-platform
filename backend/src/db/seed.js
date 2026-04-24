import { db } from './index.js';
import { users, posts, likes, comments, notifications, streaks, achievements, messages, userQuests, quests } from './schema.js';
import bcrypt from 'bcryptjs';
async function seed() {
    console.log('🌌 Initializing Sector Seeding...');
    try {
        // Clear existing data in reverse dependency order
        console.log('🧹 Cleaning existing sector data...');
        await db.delete(notifications);
        await db.delete(comments);
        await db.delete(likes);
        await db.delete(achievements);
        await db.delete(messages);
        await db.delete(streaks);
        await db.delete(userQuests);
        await db.delete(posts);
        await db.delete(quests);
        await db.delete(users);
        const hashedPassword = await bcrypt.hash('password123', 10);
        console.log('👤 Synchronizing Pioneers...');
        const seedUsers = [
            { username: 'Kinetic AI', email: 'ai@kinetic.net', passwordHash: hashedPassword, xp: 99999, avatarUrl: 'https://images.unsplash.com/photo-1675271591211-126ad94e495d?q=80&w=2670&auto=format&fit=crop' },
            { username: 'alex', email: 'alex@example.com', passwordHash: hashedPassword, xp: 1850 },
            { username: 'maya', email: 'maya@example.com', passwordHash: hashedPassword, xp: 850 },
            { username: 'sam', email: 'sam@example.com', passwordHash: hashedPassword, xp: 450 },
        ];
        const insertedUsers = [];
        for (const user of seedUsers) {
            const [inserted] = await db.insert(users).values(user).returning();
            if (inserted)
                insertedUsers.push(inserted);
        }
        const alex = insertedUsers.find(u => u.username === 'alex');
        const maya = insertedUsers.find(u => u.username === 'maya');
        const sam = insertedUsers.find(u => u.username === 'sam');
        if (!alex || !maya || !sam) {
            throw new Error('Failed to seed prerequisite users');
        }
        console.log('📸 Deploying High-XP Content...');
        const seedPosts = [
            {
                userId: alex.id,
                caption: 'Behold the 4K glory of the Nebula Sector.',
                postType: 'image',
                imageUrl: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?q=80&w=3538&auto=format&fit=crop',
                impactScore: 120
            },
            {
                userId: maya.id,
                caption: 'Sector 7 News: Anomalous energy readings detected near the core.',
                postType: 'news',
                impactScore: 500
            },
            {
                userId: sam.id,
                caption: 'Drifting through the rings of Saturn.',
                postType: 'reel',
                videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
                impactScore: 280
            }
        ];
        for (const post of seedPosts) {
            await db.insert(posts).values(post);
        }
        console.log('✅ Sector Seeding Completed Successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}
seed();
//# sourceMappingURL=seed.js.map