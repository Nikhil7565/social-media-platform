import { db } from '../src/db/index.js';
import { users, messages } from '../src/db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { getAIResponse } from '../src/utils/ai.js';

async function testAI() {
    console.log("🔍 Checking AI Integration...");
    
    // 1. Find AI
    const [ai] = await db.select().from(users).where(eq(users.username, 'Kinetic AI'));
    if (!ai) {
        console.error("❌ Kinetic AI not found in DB!");
        process.exit(1);
    }
    console.log(`✅ Found AI with ID: ${ai.id}`);

    // 2. Find a test user (alex)
    const [alex] = await db.select().from(users).where(eq(users.username, 'alex'));
    if (!alex) {
        console.error("❌ Alex not found in DB!");
        process.exit(1);
    }

    // 3. Simulate message to AI
    console.log("💬 Simulating message from Alex to AI...");
    const content = "Hello Kinetic AI, how do I get xp?";
    await db.insert(messages).values({
        senderId: alex.id,
        receiverId: ai.id,
        content,
        isRead: 0
    });

    // 4. Wait for AI response (The backend route has a 1000ms timeout)
    // NOTE: This script doesn't trigger the backend route logic because it hits the DB directly.
    // To test the logic, I need to check the logic function.
    console.log("⚙️  Testing AI Response Engine...");
    const reply = getAIResponse(content);
    console.log(`🤖 AI would reply: "${reply}"`);

    if (reply.length > 0) {
        console.log("✅ AI Logic Engine functional.");
    } else {
        console.error("❌ AI Logic Engine failed to produce response.");
    }

    // 5. Final check on Frontend Logic (Dynamic ID)
    const [aiUser] = await db.select({ id: users.id })
            .from(users)
            .where(eq(users.username, 'Kinetic AI'));
    
    console.log(`🔗 Frontend Dynamic Link check: Pointing to /messages/${aiUser?.id}`);
    
    process.exit(0);
}

testAI();
