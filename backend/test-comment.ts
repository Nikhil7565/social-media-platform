import { db } from './src/db/index.js';
import { users, posts, comments, messages, streaks } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function run() {
  try {
    // 1. Setup a user
    let [user1] = await db.insert(users).values({ username: 'test1_' + Date.now(), email: 't1@' + Date.now() + '.com', passwordHash: '123' }).returning();
    let [user2] = await db.insert(users).values({ username: 'test2_' + Date.now(), email: 't2@' + Date.now() + '.com', passwordHash: '123' }).returning();
    
    // 2. Create a post
    let [post] = await db.insert(posts).values({ userId: user1!.id, caption: 'test post' }).returning();
    
    console.log('Testing Comment...');
    try {
      const [comment] = await db.insert(comments).values({ postId: post!.id, userId: user2!.id, content: 'Nice!' }).returning();
      console.log('Comment success:', comment);
    } catch (e: any) {
      console.log('Comment failed:', e.message);
    }
    
    console.log('Testing Message...');
    try {
      const [msg] = await db.insert(messages).values({ senderId: user1!.id, receiverId: user2!.id, content: 'Hello' }).returning();
      let [streak] = await db.insert(streaks).values({ user1Id: user1!.id, user2Id: user2!.id, streakCount: 0, lastMessageAt: new Date().toISOString() }).returning();
      console.log('Message success:', msg);
    } catch (e: any) {
      console.log('Message failed:', e.message);
    }

    process.exit(0);
  } catch (e: any) {
    console.log('Setup failed:', e.message);
  }
}

run();
