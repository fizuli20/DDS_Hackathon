# Supabase — tam verilənlər bazası

Bu layihədə **tək “həqiqi” verilənlər bazası** [Supabase](https://supabase.com) üzərindəki **PostgreSQL**-dir. Bütün server tərəfi işlər **NestJS API** vasitəsilə bu DB-yə gedir.

## Arxitektura

```
Brauzer (Next.js)  →  /api proxy  →  NestJS (TypeORM)  →  Supabase Postgres
```

- **Brauzer birbaşa Postgres-ə qoşulmur** (təhlükəsizlik). `NEXT_PUBLIC_SUPABASE_*` yalnız əlavə xüsusiyyətlər (məs. gələcəkdə Realtime, Storage) üçün istifadə oluna bilər.
- **Backend** üçün kifayət: `DATABASE_URL` (Supabase → **Project Settings → Database → Connection string**, üstünlük **Direct connection**, port **5432**).

## 1. Supabase layihəsi

1. Yeni layihə yarat.
2. **Database** bölməsindən **database password** saxla.
3. **Connection string** → URI kopyala (məs. `postgresql://postgres.[ref]:[password]@db.[ref].supabase.co:5432/postgres`).

## 2. Backend env (Render / Railway / lokal)

`backend/` kökündə və ya hostinqdə:

```env
DATABASE_URL=postgresql://...@db.xxxxx.supabase.co:5432/postgres
ENABLE_DB=true
TYPEORM_SYNC=true
JWT_SECRET=uzun-təsadüfi-mətn
FRONTEND_URL=https://your-app.vercel.app,http://localhost:3000
```

- **İlk deploy** (boş DB): `TYPEORM_SYNC=true` saxla — TypeORM `entities` əsasında cədvəlləri yaradır (`users`, `audit_logs`, `data_sources`, `unified_students` və s.).
- **Sonra** production üçün `TYPEORM_SYNC=false` et və (lazım olsa) SQL migration əlavə et — canlıda `sync` risklidir.

**Qeyd:** `backend/db/schema/schema.sql` köhnə/əksik ola bilər; **əsas həqiqət** TypeORM entity-ləridir.

## 3. SSL

`DATABASE_URL` host-u `supabase.co` / `supabase.com` içindədirsə, Nest `typeorm` config və `db` skriptləri TLS-i avtomatik qoşur. Əks halda: `DATABASE_SSL=true|false`.

## 4. `npm run db:schema`

`db` skriptləri indi Supabase SSL ilə işləyir. `schema.sql` bütün cədvəlləri əhatə etməyə bilər — **boş Supabase** üçün ilk seçim **TypeORM sync**-dir.

## 5. Frontend (Vercel)

- Env dəyişənlərinin siyahısı və **Vercel CLI** ilə əlavə etmə: **[VERCEL_ENV.md](./VERCEL_ENV.md)**.
- API: `NEXT_PUBLIC_API_BASE_URL` (adətən `/api`) və serverdə **`BACKEND_API_URL`** (Nest baza URL, sonu `/api`).
- Real auth: `NEXT_PUBLIC_USE_AUTH_API=true` + backend `/auth/*`.
- `NEXT_PUBLIC_SUPABASE_URL` və publishable/anon key — yalnız Supabase client xüsusiyyətləri üçün; **əsas DB əməliyyatları** yenə də API ilə.

## 6. IPv4 / pooler

Bəzi şəbəkələrdə **birbaşa** `5432` əvəzinə **Session pooler** lazım ola bilər. Supabase sənədlərində “Connection pooling” bölməsinə bax. Nəticə: Nest üçün **transaction** pooler əvəzinə **direct** və ya **session** rejimi seç.

---

**Qısa:** Bütün DB işləri Supabase Postgres üzərindədir; **tək giriş** — NestJS + `DATABASE_URL`.
