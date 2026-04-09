const { Client } = require('pg');
const { getPgSsl } = require('./pg-ssl');

async function main() {
  const connectionString =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5432/Activity_checker';
  const client = new Client({
    connectionString,
    ssl: getPgSsl(connectionString),
  });
  await client.connect();
  try {
    const res = await client.query(`
      SELECT tablename, indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename IN (
          'users',
          'students',
          'activity_events',
          'score_snapshots',
          'notification_logs',
          'imports',
          'audit_logs'
        )
      ORDER BY tablename, indexname;
    `);
    for (const row of res.rows) {
      console.log(`${row.tablename}: ${row.indexname}`);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
