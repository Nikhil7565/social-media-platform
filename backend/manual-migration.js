import { createClient } from '@libsql/client';
const client = createClient({ url: 'file:./sqlite.db' });
async function run() {
    const migrations = [
        `ALTER TABLE posts ADD COLUMN post_type TEXT DEFAULT 'text'`,
        `ALTER TABLE posts ADD COLUMN video_url TEXT`,
    ];
    for (const m of migrations) {
        try {
            await client.execute(m);
            console.log('OK:', m.slice(0, 50));
        }
        catch (e) {
            if (e.message?.includes('duplicate column'))
                console.log('Already exists, skipping.');
            else
                console.error('Error:', e.message);
        }
    }
    process.exit(0);
}
run();
//# sourceMappingURL=manual-migration.js.map