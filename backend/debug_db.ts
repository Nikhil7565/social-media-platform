import { db } from './src/db/index.js';
import { users, posts } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function debug() {
  console.log('--- DATABASE DEBUG ---');
  const allPosts = await db.select().from(posts);
  const allUsers = await db.select().from(users);
  
  console.log('Total Users:', allUsers.length);
  console.log('User IDs:', allUsers.map(u => u.id));
  
  console.log('Total Posts:', allPosts.length);
  const reels = allPosts.filter(p => p.postType === 'reel');
  console.log('Reels Found:', reels.length);
  
  reels.forEach(r => {
    console.log(`Reel ID: ${r.id}, Assigned UserID: ${r.userId}, Video: ${r.videoUrl}`);
  });
  
  const matches = reels.filter(r => allUsers.some(u => u.id === r.userId));
  console.log('Reels with VALID UserIDs:', matches.length);
  
  process.exit(0);
}

debug().catch(e => {
  console.error(e);
  process.exit(1);
});
