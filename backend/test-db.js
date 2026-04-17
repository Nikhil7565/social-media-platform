import postgres from 'postgres';
const sql = postgres('postgres://postgres:postgres@localhost:5432/postgres');
async function test() {
    try {
        await sql `CREATE DATABASE kinetic`;
        console.log('Database kinetic created');
    }
    catch (e) {
        console.error(e.message);
    }
    process.exit(0);
}
test();
//# sourceMappingURL=test-db.js.map