import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema.js';
import dotenv from 'dotenv';
dotenv.config();

const client = createClient({
  url: 'file:./sqlite.db',
});

export const db = drizzle(client, { schema });
