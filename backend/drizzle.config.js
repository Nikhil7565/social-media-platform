import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';
dotenv.config();
export default defineConfig({
    schema: './src/db/schema.ts',
    out: './drizzle',
    dialect: 'sqlite',
    dbCredentials: {
        url: 'file:./sqlite.db',
    },
});
//# sourceMappingURL=drizzle.config.js.map