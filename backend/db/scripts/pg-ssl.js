/**
 * pg client SSL options for Supabase / managed Postgres.
 * Matches backend/src/config/typeorm.config.ts behaviour.
 */
function getPgSsl(connectionString) {
  if (!connectionString) return false;
  if (process.env.DATABASE_SSL === 'false') return false;
  if (process.env.DATABASE_SSL === 'true') return { rejectUnauthorized: false };
  return /supabase\.(co|com)/i.test(connectionString) ? { rejectUnauthorized: false } : false;
}

module.exports = { getPgSsl };
