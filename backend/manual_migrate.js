import { createClient } from '@libsql/client';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: process.env.DATABASE_URL || 'file:./sqlite.db',
});

async function migrate() {
  try {
    console.log('Adding profile_theme to users...');
    try {
      await client.execute("ALTER TABLE users ADD COLUMN profile_theme TEXT NOT NULL DEFAULT 'default'");
    } catch (e) {
      console.log('profile_theme might already exist or table is busy.');
    }

    console.log('Adding type to likes...');
    try {
       await client.execute("ALTER TABLE likes ADD COLUMN type TEXT NOT NULL DEFAULT 'like'");
    } catch (e) {
       console.log('type might already exist.');
    }

    console.log('Creating quests table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS quests (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        reward_xp INTEGER NOT NULL,
        type TEXT NOT NULL,
        target INTEGER NOT NULL
      )
    `);

    console.log('Creating user_quests table...');
    await client.execute(`
      CREATE TABLE IF NOT EXISTS user_quests (
        user_id INTEGER NOT NULL REFERENCES users(id),
        quest_id TEXT NOT NULL REFERENCES quests(id),
        progress INTEGER NOT NULL DEFAULT 0,
        is_completed INTEGER DEFAULT 0,
        is_claimed INTEGER DEFAULT 0,
        date TEXT NOT NULL,
        PRIMARY KEY (user_id, quest_id, date)
      )
    `);

    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit(0);
  }
}

migrate();
 attendance
