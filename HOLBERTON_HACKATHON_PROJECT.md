# 🎓 Holberton Student Performance Tracking System (HSPTS)
## Engineering Specification + Implementation-Ready Documentation

Bu sənəd mövcud ideyanı “hackathon konsepti” səviyyəsindən çıxarıb, **real backend + DB + job-lar + API** üçün istifadə oluna bilən spesifikasiyaya çevirir.

---

## 📌 1) Məqsəd və problem

**Məqsəd:** Holberton tələbələrinin fəaliyyətini (PLD, imtahan, tapşırıq, davamiyyət) toplamaq, **aktivlik skorunu** hesablamaq və **risk altında olan tələbələri** erkən aşkarlamaq.

**Hədəf istifadəçilər:**
- **Admin/Coordinator**: bütün kohortların idarəsi, batch report/notification
- **Mentor**: öz tələbələri üzrə izləmə, müdaxilə planı
- **Student**: şəxsi progress və hesabat

---

## ✅ 2) Tələblər (Requirements)

### Funksional tələblər
- **Data ingestion**: manual giriş + Excel/CSV upload; (opsional) Holberton sistemindən sync.
- **Activity scoring**: çəkili formula ilə hesablanma, tarixə görə trend.
- **Risk engine**: threshold + trend qaydası; cohort/track müqayisəsi.
- **Dashboard**: overview, filter, drill-down profil, at-risk report.
- **Reporting**: PDF + Excel export; həftəlik/aylıq/individual report.
- **Notifications**: email + (opsional) telegram; şablonlar; göndərmə logu.
- **RBAC**: admin/mentor/student/coordinator rolları, resurs səviyyəli icazələr.
- **Audit**: əsas əməliyyatlar (import, manual edit, status change, notification).

### Non-funksional tələblər
- **Performans**: list view pagination; index-lər; dashboard agregasiyaları cache edilə bilər.
- **İzlənəbilənlik**: struktur loglar, job statusları, import error report.
- **Təhlükəsizlik**: JWT + refresh, rate limit, input validation, PII qorunması.

---

## 🧱 3) Ümumi texniki arxitektura (Tech + Components)

### Tövsiyə edilən stack (MERN-ə yaxın, amma “production” fokuslu)
- **Backend**: Node.js + **NestJS** (və ya Express.js + layered architecture)
- **DB**: **PostgreSQL** (relational model + constraints + SQL analytics üçün uyğundur)
- **Cache/Queue (opsional amma tövsiyə)**: Redis + BullMQ (notification/report job-ları)
- **Auth**: JWT (access+refresh), role+scopes
- **Frontend**: React 18 (MUI və ya Tailwind), Recharts/Chart.js
- **Reports**: PDFKit / Puppeteer (HTML→PDF daha stabil ola bilər)
- **Scheduler**: BullMQ repeatable jobs (və ya node-cron; queue daha etibarlıdır)

### Servis parçalanması (monolith içində modul kimi)
- **Auth & Users**: login, refresh, RBAC
- **Students/Cohorts**: student/mentor mapping, cohort management
- **Activity Ingestion**: manual entry, file import, sync adapter
- **Scoring & Risk**: skor hesablanma, risk status və trend
- **Notifications**: templating, send, retry, logs
- **Reports**: PDF/Excel generasiya
- **Admin/Audit**: audit log, settings, weights/thresholds

---

## 🗂️ 4) DB dizaynı (PostgreSQL) — tövsiyə olunan struktur

Sənəddə “student” sənədi içində nested activities göstərilib; bu, realda böyüyəndə şişir. Tövsiyə: **normalized-ish** yanaşma:
- `students`: master data
- `cohorts`: cohort meta
- `mentors`: mentor profili (və ya `users` ilə birləşdir)
- `activity_events`: xam hadisələr (PLD session attendance, exam result, task submission, class attendance)
- `score_snapshots`: gündəlik/həftəlik agregasiya (dashboard sürətli olsun)
- `notification_logs`: göndərilən bildirişlər
- `imports`: upload/sync run-ları (status + error summary)
- `audit_logs`: kim nəyi nə vaxt dəyişdi

### 4.1 Collections (əsas sahələr)

#### `users`
- `_id`
- `email` (unique)
- `passwordHash` (argon2/bcrypt)
- `role`: `admin|coordinator|mentor|student`
- `status`: `active|disabled`
- `createdAt`, `updatedAt`

#### `students`
- `_id`
- `studentId` (unique, “HB-2024-001”)
- `firstName`, `lastName`
- `email` (unique)
- `track`: `cyber_security|computer_science|full_stack|ml`
- `cohortId` (ref)
- `mentorUserId` (ref `users._id`, role=mentor)
- `status`: `active|suspended|dropped_out`
- `enrollmentDate`
- `createdAt`, `updatedAt`

#### `activity_events`
- `_id`
- `studentId` (ref `students._id` və ya `studentId` string; **tövsiyə**: `studentObjectId` ref)
- `cohortId` (denormalized ref, dashboard filter üçün)
- `track` (denormalized, filter üçün)
- `source`: `manual|import|sync`
- `type`: `pld|exam|task|attendance`
- `occurredAt` (event tarixi)
- `payload` (type-a görə dəyişir)
- `createdByUserId` (manual olduqda)
- `createdAt`

**Payload nümunələri**

PLD:
```json
{
  "type": "pld",
  "occurredAt": "2024-03-20T00:00:00.000Z",
  "payload": {
    "sessionId": "PLD-2024-037",
    "attended": true,
    "minutes": 240,
    "notes": "Active participation"
  }
}
```

Exam:
```json
{
  "type": "exam",
  "occurredAt": "2024-02-15T00:00:00.000Z",
  "payload": {
    "examKey": "python_basics_v1",
        "name": "Python Basics",
        "score": 85,
        "maxScore": 100,
    "durationMinutes": 120
  }
}
```

Task:
```json
{
  "type": "task",
  "occurredAt": "2024-03-18T00:00:00.000Z",
  "payload": {
    "taskKey": "TASK-2024-001",
    "name": "Build a Flask API",
    "status": "completed",
    "grade": 95,
    "dueAt": "2024-03-20T00:00:00.000Z",
    "submittedAt": "2024-03-18T00:00:00.000Z"
  }
}
```

Attendance:
```json
{
  "type": "attendance",
  "occurredAt": "2024-03-21T00:00:00.000Z",
  "payload": {
    "classKey": "CS101-2024-03-21",
    "attended": true
  }
}
```

#### `score_snapshots`
Dashboard və “trend” üçün **precomputed** agregasiya.
- `_id`
- `studentId` (ref)
- `date` (günlük snapshot üçün date-only)
- `windowDays`: `7|30|90` (opsional, rolling window)
- `components`:
  - `pldPct`
  - `examPct`
  - `taskPct`
  - `attendancePct`
- `overallScore` (0..100)
- `riskLevel`: `strong|medium|weak|at_risk`
- `trend`: `up|stable|down`
- `computedAt`

#### `notification_logs`
- `_id`
- `studentId` (ref)
- `recipientUserId` (mentor/admin/student)
- `channel`: `email|telegram|in_app`
- `templateKey`: `weekly_checkin|critical_alert|positive_update|custom`
- `subject`
- `body`
- `status`: `pending|sent|failed`
- `providerMessageId` (email provider / telegram message id)
- `error` (failed olduqda)
- `createdAt`, `sentAt`

#### `imports`
Excel/CSV upload və sync run-larının izi.
- `_id`
- `type`: `students|pld|exams|tasks|attendance`
- `source`: `upload|sync`
- `status`: `running|succeeded|failed|partial`
- `startedAt`, `finishedAt`
- `stats`: `totalRows`, `inserted`, `updated`, `skipped`, `errors`
- `errorSample` (ilk N error)
- `createdByUserId`

#### `audit_logs`
- `_id`
- `actorUserId`
- `action`: `student.update|event.create|event.delete|import.run|notification.send|settings.update`
- `targetType`: `student|activity_event|import|notification|settings`
- `targetId`
- `diff` (before/after summary)
- `createdAt`

### 4.2 Index-lər (kritik)
PostgreSQL-də performansın əsasını düzgün index strategiyası təşkil edir.
- `users.email` unique
- `students.studentId` unique
- `students.email` unique
- `students.cohortId, students.track, students.status` (filter)
- `activity_events.studentId + occurredAt` (timeline)
- `activity_events.cohortId + type + occurredAt` (dashboard agregasiya)
- `score_snapshots.studentId + date` unique (günlük)
- `notification_logs.studentId + createdAt`
- `imports.createdAt`

---

## 🧮 5) Skor hesablanması (Scoring) — dəqiq qayda

### 5.1 Çəkilər (default)
- PLD: **25%**
- Exam: **30%**
- Tasks: **25%**
- Attendance: **20%**

### 5.2 Formula
\[
\text{Overall} = 0.25\cdot \text{PLD\%} + 0.30\cdot \text{Exam\%} + 0.25\cdot \text{Tasks\%} + 0.20\cdot \text{Attendance\%}
\]

### 5.3 Component faizlərinin hesablanması (tövsiyə)
- **PLD%**: \( attendedSessions / requiredSessions \times 100 \)
- **Exam%**: son N imtahanın (və ya windowDays) **average percentage**; imtahan yoxdursa fallback qaydası (məs: 0 və ya “N/A”).
- **Tasks%**: completed/assigned; grade varsa ayrıca “quality score” əlavə edilə bilər.
- **Attendance%**: attendedClasses/totalClasses.

**Vacib qərar:** “data boşdur” halları üçün qayda sənəddə dəqiq olmalıdır:
- Variant A (sadə): boş component = 0% (risk konservativ olur)
- Variant B (ədalətli): boş component çəkisi müvəqqəti 0 edilir və qalan çəkilər yenidən normallaşdırılır

Tövsiyə: **Variant B** (məs: yeni tələbə hələ exam verməyibsə, avtomatik riskə düşməsin).

---

## 🚦 6) Risk engine (status + trend)

### 6.1 Risk level threshold-ları (default)
| Overall Score | Risk Level |
|---|---|
| 85–100 | `strong` |
| 70–84 | `medium` |
| 50–69 | `weak` |
| <50 | `at_risk` |

### 6.2 Trend qaydası (default)
- `up`: son 7 gün ortalaması > əvvəlki 7 gün ortalaması + 2
- `down`: son 7 gün ortalaması < əvvəlki 7 gün ortalaması - 2
- əks halda `stable`

### 6.3 Alert qaydaları (nümunə)
- `at_risk` olduqda: mentor + coordinator-a **immediate** notification
- `weak` və `trend=down` olduqda: weekly check-in
- `medium` və `trend=down` 2 həftə ardıcıl: warning notification

---

## 🔐 7) Auth + RBAC (icazə matrisi)

### Rollar
- `admin`
- `coordinator`
- `mentor`
- `student`

### Qısa icazələr
- **Admin**: full access (users, students, settings, exports)
- **Coordinator**: bütün students read + reports + notifications (limitli settings)
- **Mentor**: yalnız `mentorUserId == self` olan tələbələr
- **Student**: yalnız öz profili (mapping: `students.email == user.email` və ya `studentUserId`)

### Texniki tövsiyə
- JWT claim-lərdə: `sub`, `role`, `scopes`, `mentorStudentIds` kimi böyük list saxlamamaq
- Access control: DB query səviyyəsində enforce etmək (mentor filter həmişə tətbiq olunur)

---

## 🌐 8) REST API kontraktı (minimum viable)

### Auth
- `POST /api/auth/login` → `{accessToken, refreshToken}`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Students
- `GET /api/students?cohortId=&track=&status=&q=&page=&pageSize=&sort=`
- `GET /api/students/:id`
- `POST /api/students` (admin/coordinator)
- `PATCH /api/students/:id` (admin/coordinator; mentor limitli sahələr)

### Activity events
- `GET /api/students/:id/events?type=&from=&to=&page=&pageSize=`
- `POST /api/students/:id/events` (manual entry)
- `POST /api/imports` (CSV/Excel upload; returns importId)
- `GET /api/imports/:id` (status + stats + error sample)

### Scoring / snapshots
- `GET /api/students/:id/snapshots?from=&to=&windowDays=30`
- `POST /api/scoring/recompute?studentId=&from=&to=` (admin/coordinator; async job)

### Reports
- `GET /api/reports/weekly?cohortId=&week=` → PDF
- `GET /api/reports/monthly?cohortId=&month=` → PDF
- `GET /api/reports/student/:id` → PDF
- `GET /api/exports/students.xlsx?...` → XLSX

### Notifications
- `POST /api/notifications/send` (manual/batch)
- `GET /api/notifications/logs?studentId=&status=&channel=&page=`

### Settings (weights/thresholds)
- `GET /api/settings/scoring`
- `PATCH /api/settings/scoring` (admin)

---

## ⏱️ 9) Job-lar və workflow-lar (queue/scheduler)

### Job tipləri
- `import.process` (parse + validate + upsert + event create)
- `scoring.compute` (studentId + date range)
- `notifications.dispatch` (retry/backoff)
- `reports.generate` (pdf/xlsx async, cache)

### Schedule (nümunə)
- Daily 06:00: `sync` (opsional) → `import.process` → `scoring.compute`
- Daily 08:00: `risk.scan` → `notifications.dispatch`
- Weekly Monday 08:00: weekly report generate + mentor digests
- Monthly 1st 09:00: monthly report + archive

---

## 🧰 10) Validasiya, data keyfiyyəti, import qaydaları

### Import üçün minimum qaydalar
- email format, unique constraint
- `studentId` pattern: `HB-YYYY-NNN`
- tarixlər ISO parse
- enum sahələr strict (track/status/type)
- “row-level errors” toplanır, `imports.errorSample`-a yazılır

### Idempotency
- Import eyni fayl təkrar yüklənəndə duplicate yaratmamalıdır:
  - exam: `studentId + examKey + occurredAt` unique
  - task: `studentId + taskKey + submittedAt` unique
  - pld: `studentId + sessionId` unique

---

## 🧯 11) Təhlükəsizlik (minimum checklist)
- Password hashing: argon2/bcrypt (salt)
- JWT: qısa access TTL, refresh rotate
- Rate limit: login və import endpoint-lər
- Input validation: DTO schema (zod/class-validator)
- PII: export icazələri, audit trail
- Secrets: `.env` və secret manager

---

## 🚀 12) Deploy (təklif)

### Minimum mühit
- Backend: Docker container
- PostgreSQL: managed service (Neon, Supabase, RDS) və ya docker compose
- Redis (opsional): queue üçün

### Environment variables (nümunə)
- `PORT`
- `MONGO_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_TTL_MIN`
- `JWT_REFRESH_TTL_DAYS`
- `EMAIL_PROVIDER` / `SMTP_*`
- `TELEGRAM_BOT_TOKEN` (opsional)
- `REDIS_URL` (opsional)

---

## 📁 13) Tövsiyə olunan repo strukturu
```
holberton-tracker/
  backend/
    src/
      modules/
        auth/
        students/
        ingestion/
        scoring/
        risk/
        notifications/
        reports/
        admin/
      common/
        db/
        rbac/
        validation/
        logging/
      main.ts
  frontend/
    src/
      pages/
      components/
      api/
  docs/
    API.md
    DATABASE.md
    DEPLOYMENT.md
```

---

## 🎯 14) “Nələrə ehtiyac var?” — qısa yekun checklist
- **DB**: `students`, `activity_events`, `score_snapshots`, `imports`, `notification_logs`, `audit_logs` + indexlər
- **Backend modullar**: auth/RBAC, ingestion(import+manual), scoring+risk, reports, notifications, admin settings
- **Infra (tövsiyə)**: Redis queue, cron/repeatable jobs, object storage (opsional: generated PDF saxlanması)
- **Dokumentasiya**: API kontrakt + import formatları + deploy env