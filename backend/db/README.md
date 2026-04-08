# Database Setup (PostgreSQL)

## Structure
- `db/schema/schema.sql` - full PostgreSQL schema
- `db/scripts/run-schema.js` - applies schema to database
- `db/scripts/verify-indexes.js` - checks index creation

## Connection
Uses `DATABASE_URL` if present, otherwise defaults to:

`postgresql://postgres:postgres@localhost:5432/Activity_checker`

## Commands
- `npm run db:schema`
- `npm run db:verify`

