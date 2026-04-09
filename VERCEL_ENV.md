# Vercel environment variables (HSPTS)

Layihə **Next.js** `frontend/` qovluğundan deploy olunur. Əvvəl `cd frontend` edib **`vercel link`** işlədin (və ya root-da layihə bağlıdırsa `--cwd frontend`).

## Lazım olan dəyişənlər

| Dəyişən | Harada istifadə | Tövsiyə |
|--------|------------------|--------|
| `BACKEND_API_URL` | `app/api/[...path]/route.ts` — Nest proxy | Məs: `https://your-api.onrender.com/api` (sonda `/api` olsun) |
| `NEXT_PUBLIC_API_BASE_URL` | Brauzerdə API baza URL | Adətən `/api` (Vercel-də eyni origin proxy üçün) |
| `NEXT_PUBLIC_USE_AUTH_API` | Real JWT auth | `true` (backend DB + auth aktiv olanda) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase client (istəyə bağlı) | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` və ya `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase client | Dashboard → API |
| `NEXT_PUBLIC_GOOGLE_SHEET_URL` | Sheet məlumat mənbəyi | Google Sheet URL |
| `OPENROUTER_API_KEY` | Server route-larda AI (əgər istifadə olunursa) | Gizli |
| `OPENROUTER_MODEL` | Model adı | Məs: `openai/gpt-4o-mini` |
| `OPENROUTER_SITE_URL` | OpenRouter header | Production sayt URL |
| `OPENROUTER_APP_NAME` | OpenRouter header | `HSPTS` və s. |

**Qeyd:** `NEXT_PUBLIC_*` brauzerə düşür — sirr saxlamayın. `BACKEND_API_URL` və `OPENROUTER_API_KEY` server tərəfdə qalır.

## CLI ilə əlavə etmək

### Tək-tək (dəyər ilə)

```powershell
cd frontend
npx vercel env add BACKEND_API_URL production --value "https://your-backend.example.com/api" --yes
npx vercel env add NEXT_PUBLIC_API_BASE_URL production --value "/api" --yes
npx vercel env add NEXT_PUBLIC_USE_AUTH_API production --value "true" --yes
npx vercel env add OPENROUTER_API_KEY production --value "sk-or-..." --yes --sensitive
```

### Tez başlanğıc (boş yerlərlə şablon)

`frontend/vercel.env.starter` faylını **`vercel.env.production.local`** kimi kopyalayın — içində yalnız təhlükəsiz minimal dəyərlər var (`/api`, `false`, model adı). Boş saxlanılan açarlar push zamanı **atlanır**; sonra özünüz doldurub yenidən push edə bilərsiniz.

### Fayldan toplu (PowerShell)

1. `frontend/vercel.env.example` faylını kopyalayıb **`frontend/vercel.env.production.local`** adı ilə doldurun (bu fayl git-ə düşmür). Alternativ: `vercel.env.starter`-dən başlayın.
2. Əmr:

```powershell
cd frontend
powershell -ExecutionPolicy Bypass -File .\scripts\vercel-push-env.ps1 -Environment production
```

Skript: boş sətirləri və `#` ilə şərhləri atlayır; `OPENROUTER_API_KEY` üçün `--sensitive` işlədir.

### Cloud-dan lokalə çəkmək (development)

```powershell
cd frontend
npx vercel env pull .env.local
```

## NPM skriptləri

`frontend/package.json` içində: `npm run vercel:env:pull` və s.
