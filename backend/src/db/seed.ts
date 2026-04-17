import { db } from './index.js';
import { users } from './schema.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('Seeding database...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const seedUsers = [
    { username: 'alex', email: 'alex@example.com', passwordHash: hashedPassword, xp: 1850 },
    { username: 'maya', email: 'maya@example.com', passwordHash: hashedPassword, xp: 850 },
    { username: 'sam', email: 'sam@example.com', passwordHash: hashedPassword, xp: 450 },
  ];

  try {
    for (const user of seedUsers) {
      console.log(`Inserting user: ${user.username}`);
      await db.insert(users).values(user).onConflictDoNothing();
    }
    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
