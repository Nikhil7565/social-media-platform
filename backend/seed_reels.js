import { db } from './src/db/index.js';
import { users, posts } from './src/db/schema.js';
import { eq } from 'drizzle-orm';
async function seedReels() {
    console.log('--- Seeding Reels ---');
    const allUsers = await db.select().from(users);
    if (allUsers.length === 0) {
        console.log('No users found. Please register or seed users first.');
        return;
    }
    const sampleReels = [
        {
            userId: allUsers[0].id,
            postType: 'reel',
            videoUrl: 'https://cdn.pixabay.com/video/2023/10/20/185834-876359239_large.mp4',
            caption: 'Testing the new Kinetic Reels logic! The future is vertical. ⚡ #tech #reels',
        },
        {
            userId: allUsers[1]?.id || allUsers[0].id,
            postType: 'reel',
            videoUrl: 'https://cdn.pixabay.com/video/2021/08/04/83946-583803027_large.mp4',
            caption: 'This immersive UI is feeling amazing. Level up your content! 🚀 #gaming #kinetic',
        },
        {
            userId: allUsers[2]?.id || allUsers[0].id,
            postType: 'reel',
            videoUrl: 'https://cdn.pixabay.com/video/2020/09/16/49968-457375204_large.mp4',
            caption: 'Sector 7 discovery. The aesthetic is real. 🌌 #vibes #sector7',
        }
    ];
    for (const reel of sampleReels) {
        await db.insert(posts).values(reel);
        console.log(`Added reel for user ${reel.userId}`);
    }
    console.log('--- Reels Seeding Complete ---');
    process.exit(0);
}
seedReels().catch(console.error);
//# sourceMappingURL=seed_reels.js.map