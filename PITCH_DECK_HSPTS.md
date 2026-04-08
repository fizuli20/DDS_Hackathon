# HSPTS Pitch Deck (Hackathon)

## 1) Layihə adı
**Holberton Student Performance Tracking System (HSPTS)**

AI və data əsaslı tələbə performans izləmə, risk aşkarlama və mentor müdaxilə platforması.

---

## 2) Problem
Təhsil komandaları aşağıdakı çətinliklərlə üzləşir:
- Tələbə performans datası fərqli mənbələrdə dağınıq qalır (PLD, exam, task, attendance)
- Risk altında olan tələbələri gec görürlər
- Mentorların sürətli və data-driven müdaxilə etməsi çətinləşir
- Rəhbərlik üçün həftəlik/aylıq report hazırlamaq vaxt aparır

---

## 3) Həll
HSPTS bir mərkəzi platformada:
- Tələbə fəaliyyətlərini toplayır və standartlaşdırır
- Skor modeli ilə ümumi performansı hesablayır
- Risk engine ilə at-risk tələbələri erkən aşkarlayır
- Dashboard və report modulu ilə qərarverməni sürətləndirir

---

## 4) Məhsul nə edir?
- **Overview Dashboard:** ümumi vəziyyət, risk paylanması, score trend
- **Students View:** filter + search + risk/trend üzrə roster
- **Student Profile:** dərin individual analiz (score ring, radar, timeline, history)
- **Reports Hub:** həftəlik/aylıq/fərdi report seçimi və export
- **Notifications/Alerts:** risk trigger-lərinə əsasən mentor/admin xəbərdarlıqları (backend hazır arxitektura)

---

## 5) Hədəf istifadəçilər
- **Admin / Coordinator:** kohort idarəetməsi, risk monitorinqi, report paylaşımı
- **Mentor:** öz tələbələrində geriləmə və müdaxilə nöqtələrinin görünməsi
- **Student (növbəti mərhələ):** şəxsi inkişaf dashboard-u

---

## 6) Differensiasiya (Niyə fərqlidir?)
- Risk siqnalları UI-də çox aydın və actionable göstərilir
- Score + trend + timeline birlikdə “nə baş verir?” sualına cavab verir
- Report axını prezentasiya və rəhbərlik paylaşımı üçün hazırdır
- Demo-dan production-a keçid üçün backend modul strukturu qurulub

---

## 7) Texnologiya stack
### Frontend
- Next.js 15
- React 19
- TailwindCSS
- Recharts
- Radix UI

### Backend
- NestJS
- TypeORM
- PostgreSQL
- BullMQ (queue/job arxitekturası)

---

## 8) Arxitektura (Qısa)
- `students`, `cohorts`, `activity_events`, `score_snapshots`, `notification_logs`, `imports`, `audit_logs`
- Modullar:
  - Users/Auth
  - Students/Cohorts
  - Activity Events (ingestion)
  - Scoring
  - Reporting
  - Notification

---

## 9) Skor modeli və risk engine
Default çəkilər:
- PLD: 25%
- Exam: 30%
- Tasks: 25%
- Attendance: 20%

Risk səviyyələri:
- 85-100: Strong
- 70-84: Medium
- 50-69: Weak
- 0-49: At Risk

Trend:
- Up / Stable / Down (son period müqayisəsi ilə)

---

## 10) Demo axını (Pitch zamanı)
1. Overview açılır: risk distribution və score trend göstərilir  
2. At-risk table-dan tələbə seçilir  
3. Student profile-də problem nöqtələri (exam/task/attendance) göstərilir  
4. Reports bölməsində müvafiq preset seçilir  
5. `Generate PDF` və `Export Excel` ilə export nümayiş etdirilir  

---

## 11) Hazır olanlar (Current Status)
- Frontend səhifələri işləkdir: Overview, Students, Student Profile, Reports
- Report düymələri aktivdir (fayl export trigger olunur)
- Backend build uğurludur
- API/DB arxitekturası real deployment üçün hazır strukturdadır

---

## 12) Qarşılaşılan texniki məsələlər
- Lokal backend run zamanı PostgreSQL user/config uyğunluğu lazımdır
- Redis servisi lokalda açıq olmalıdır (queue üçün)

Bu, məhsul problemini deyil, lokal infrastruktur konfiqurasiyasını göstərir.

---

## 13) Biznes dəyəri
- Riskin erkən aşkarlanması ilə drop-out azalır
- Mentor vaxtı daha düzgün prioritetləşir
- Data toplama və report hazırlama vaxtı qısalır
- Rəhbərlik üçün ölçüləbilən akademik KPI-lar formalaşır

---

## 14) Go-to-Market (ilk addımlar)
- Pilot: 1 kampus / 2 kohort
- 4-6 həftəlik monitorinq və nəticə ölçümü
- KPI:
  - At-risk detection lead time
  - Mentor intervention response time
  - Weekly score improvement
  - Attendance recovery

---

## 15) Yol xəritəsi
### Qısa müddət (0-2 ay)
- Real API inteqrasiyası (frontend mock data-nın çıxarılması)
- Auth + RBAC tam aktiv
- Report servisini backend stream endpoint-lərinə keçirmək

### Orta müddət (2-4 ay)
- Notification automations (email/telegram)
- Scheduled weekly digest
- Advanced risk heuristics

### Uzun müddət (4+ ay)
- ML əsaslı risk prediction
- Student self-service panel
- Multi-campus benchmark analytics

---

## 16) Team üçün təqdimat notları
- Fokus cümlə: **“HSPTS mentorların reaksiyasını gecikmədən data əsaslı qərara çevirir.”**
- Demo zamanı rəqəmləri deyil, “actionability” hekayəsini vurğulayın
- Final call-to-action: pilot icazəsi və real data ilə 2 həftəlik proof-of-value

---

## 17) Qısa elevator pitch
HSPTS təhsil komandalarına tələbə performansını real vaxtda görmək, risk altındakı tələbələri erkən tapmaq və mentor müdaxiləsini sürətləndirmək üçün qurulmuş analitik platformadır. Platforma dağınıq akademik datanı bir mərkəzdə birləşdirir, score/risk modeli ilə qərarverməni sadələşdirir və export-ready reportlarla rəhbərlik səviyyəsində görünürlük yaradır.
