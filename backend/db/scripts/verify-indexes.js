const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString:
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@localhost:5432/Activity_checker',
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
