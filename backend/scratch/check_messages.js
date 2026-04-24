import { db } from '../src/db/index.js';
import { messages } from '../src/db/schema.js';
import { or, eq } from 'drizzle-orm';
async function check() {
    const aiMessages = await db.select().from(messages).where(or(eq(messages.senderId, 13), eq(messages.receiverId, 13))).orderBy(messages.createdAt);
    console.log(JSON.stringify(aiMessages, null, 2));
    process.exit(0);
}
check();
//# sourceMappingURL=check_messages.js.map