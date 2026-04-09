const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { getPgSsl } = require('./pg-ssl');

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/Activity_checker';
  const sqlPath = path.join(__dirname, '..', 'schema', 'schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const client = new Client({ connectionString, ssl: getPgSsl(connectionString) });
  await client.connect();
  try {
    await client.query(sql);
    const tables = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN (
          'users',
          'cohorts',
          'students',
          'activity_events',
          'score_snapshots',
          'notification_logs',
          'imports',
          'audit_logs'
        )
      ORDER BY tablename;
    `);
    console.log('Created/verified tables:', tables.rows.map((r) => r.tablename).join(', '));
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Schema execution failed:', err.message);
  process.exit(1);
});
