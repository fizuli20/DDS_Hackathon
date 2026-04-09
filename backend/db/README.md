# Database (PostgreSQL on Supabase)

**Məhsul üçün əsas DB:** [Supabase](https://supabase.com) üzərindəki **PostgreSQL**. Lokal Postgres yalnız inkişaf üçün istifadə oluna bilər.

## Struktur

- `db/schema/schema.sql` — köhnə SQL (bütün TypeORM cədvəllərini əhatə etməyə bilər)
- `db/scripts/run-schema.js` — SQL faylını işlədir (Supabase üçün SSL dəstəyi)
- `db/scripts/verify-indexes.js` — indekslər
- `db/scripts/pg-ssl.js` — Supabase host ilə bağlantı üçün TLS

## Əsas quraşdırma (tövsiyə)

1. Supabase-də layihə yarat, **Database → Connection string** (`DATABASE_URL`) götür.
2. Backend env: `DATABASE_URL`, `ENABLE_DB=true`, `TYPEORM_SYNC=true` (ilk dəfə boş DB üçün).
3. NestJS-i işə sal — TypeORM entity-lərindən cədvəllər yaranır.

Tam təlimat: **[SUPABASE.md](../../SUPABASE.md)** (repo kökü).

## Əmrlər

- `npm run db:schema` — `schema.sql` işlədir (Supabase üçün `DATABASE_URL` təyin et)
- `npm run db:verify`

## Əlaqə

Əvvəlki default (lokal): `postgresql://postgres:postgres@localhost:5432/Activity_checker`  

İndi **production** üçün `DATABASE_URL` həmişə Supabase URI olmalıdır.
