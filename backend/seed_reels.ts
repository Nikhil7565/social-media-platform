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
      userId: allUsers[0]!.id,
      postType: 'reel',
      videoUrl: 'https://archive.org/download/BigBuckBunny_124/Content/big_buck_bunny_720p_surround.mp4',
      caption: 'Testing the new Kinetic Reels logic! The future is vertical. ⚡ #tech #reels',
    },
    {
      userId: allUsers[1]?.id || allUsers[0]!.id,
      postType: 'reel',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      caption: 'This immersive UI is feeling amazing. Level up your content! 🚀 #gaming #kinetic',
    },
    {
      userId: allUsers[2]?.id || allUsers[0]!.id,
      postType: 'reel',
      videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
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
