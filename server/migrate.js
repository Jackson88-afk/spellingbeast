'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const { Pool } = require('pg');

async function migrate() {
  if (!process.env.DATABASE_URL_UNPOOLED) throw new Error('DATABASE_URL_UNPOOLED is required.');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_UNPOOLED, ssl: { rejectUnauthorized: true }, max: 1 });
  const client = await pool.connect();
  try {
    await client.query('create table if not exists public.schema_migrations (name text primary key, applied_at timestamptz not null default now())');
    const directory = path.join(__dirname, '..', 'migrations');
    const files = (await fs.readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
    for (const name of files) {
      const exists = await client.query('select 1 from public.schema_migrations where name = $1', [name]);
      if (exists.rowCount) continue;
      const sql = await fs.readFile(path.join(directory, name), 'utf8');
      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('insert into public.schema_migrations (name) values ($1)', [name]);
        await client.query('commit');
        console.log(JSON.stringify({ level: 'info', event: 'migration_applied', name }));
      } catch (error) {
        await client.query('rollback');
        throw error;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((error) => {
  console.error(JSON.stringify({ level: 'fatal', code: 'migration_failed', message: error.message }));
  process.exit(1);
});
