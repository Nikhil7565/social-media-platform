import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.DATABASE_URL || 'file:./sqlite.db',
});

async function debug() {
  try {
    console.log('Quests table:');
    const q = await client.execute("SELECT * FROM quests");
    console.table(q.rows);

    console.log('User quests:');
    const uq = await client.execute("SELECT * FROM user_quests");
    console.table(uq.rows);

    const date = new Date().toISOString().split('T')[0];
    console.log('Current ISO Date:', date);
  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    process.exit(0);
  }
}

debug();
