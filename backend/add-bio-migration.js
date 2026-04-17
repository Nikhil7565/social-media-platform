import { createClient } from '@libsql/client';
const client = createClient({ url: 'file:./sqlite.db' });
async function run() {
    try {
        await client.execute(`ALTER TABLE users ADD COLUMN bio TEXT`);
        console.log('Successfully added bio column to users table');
    }
    catch (e) {
        if (e.message?.includes('duplicate column')) {
            console.log('Bio column already exists, skipping.');
        }
        else {
            console.error('Migration error:', e.message);
        }
    }
    process.exit(0);
}
run();
//# sourceMappingURL=add-bio-migration.js.map