# COMSATS VSPARK — Quiz Competition

> **"Challenge your knowledge. Prove your intelligence."**

COMSATS VSPARK is a full-stack web platform for managing a regional university-level computing competition. It supports team registration, four-round competition management (MCQ → Rapid Fire → Buzzer Final), live adjudication, automated scoring, results publication, and a complete admin console.

---

## Technology Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Auth & DB | Supabase (PostgreSQL + Auth + RLS) |
| Forms | React Hook Form + Zod |
| Notifications | Sonner |
| CSV Processing | PapaParse |
| Tests | Vitest |

---

## Project Structure

```
src/
  app/              ← Next.js App Router pages & API routes
    (auth, login, register, forgot-password, reset-password)
    dashboard/      ← Participant portal (protected)
    admin/          ← Admin console (protected, admin role required)
    api/            ← REST API routes
    quiz/           ← Online quiz arena
    announcements/  ← Public announcements
    leaderboard/    ← Public leaderboard
    results/        ← Public results
  components/       ← Reusable UI components
    layout/         ← Navbar, Footer, Sidebar nav
    forms/          ← TeamRegistrationForm
    sections/       ← Homepage sections
  config/           ← Centralized branding & constants
  lib/
    supabase/       ← Client & server Supabase clients
    scoring.ts      ← Scoring & qualification engine
    validations/    ← Zod schemas
    utils.ts        ← Utility functions
  middleware.ts     ← Auth route protection
  types/            ← TypeScript types & database types
supabase/
  migrations/       ← Database migration files (apply in order)
  bootstrap_admin.sql ← One-time admin promotion script
test/               ← Vitest test files
```

---

## Local Installation

### Prerequisites
- Node.js ≥ 20
- A [Supabase](https://supabase.com) project (free tier works)

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd VSpark

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials and app URL

# 4. Set up the database (see section below)

# 5. Start the development server
npm run dev
```

---

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server-only** service role key (never expose to client) |
| `QUESTION_BANK_ENCRYPTION_KEY` | **Server-only** AES-256-GCM key (base64 32 bytes or strong passphrase) |
| `NEXT_PUBLIC_APP_URL` | App base URL (e.g. `https://mindsphere.example.com`) |
| `NEXT_PUBLIC_DEVELOPER_ESHA_LINKEDIN_URL` | LinkedIn URL for Esha Minahil |
| `NEXT_PUBLIC_DEVELOPER_SEERAT_LINKEDIN_URL` | LinkedIn URL for Seerat Rauf |

---

## Database Setup

Apply the migrations in order in your Supabase SQL Editor or via the CLI:

```sql
-- 1. Core schema (tables, indexes, triggers, SECURITY DEFINER functions)
supabase/migrations/001_initial_schema.sql

-- 2. Row Level Security policies
supabase/migrations/002_rls_policies.sql

-- 3. Seed data (subjects, rounds, competition settings)
supabase/migrations/003_seed_data.sql

-- 4. COMSATS VSPARK rebranding (updates registration ref format + settings)
supabase/migrations/004_nexora_rebranding.sql

-- 5. Security fixes (additive — notification policy, non-captain member access)
supabase/migrations/005_security_fixes.sql

-- 6. MINDSPHERE rebranding reference format
supabase/migrations/006_vspark_rebranding.sql

-- 7. Encrypted question banks + practice question tables
supabase/migrations/007_secure_question_bank.sql

-- 8. Team registration redesign (usernames + invitation records)
supabase/migrations/008_team_registration_redesign.sql

-- 9. Private storage bucket + question-bank RLS hardening
supabase/migrations/009_question_bank_storage_hardening.sql

-- 10. Full team model, DB-enforced limits, membership RLS, atomic RPC
supabase/migrations/010_team_registration_redesign.sql
```

### Manual Supabase configuration

1. **Encryption key** — generate one locally and add it to `.env.local` (server only):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
   Set `QUESTION_BANK_ENCRYPTION_KEY` and restart the server. Never expose it with a `NEXT_PUBLIC_` prefix.
2. **Storage bucket** — migration 009 creates the private `question-banks` bucket. If your project
   disallows SQL on `storage.buckets`, create a bucket named `question-banks` manually and keep it
   **private**; do not add storage policies for `anon`/`authenticated`.
3. **Auth email** — teammate invitations and password resets use Supabase Auth email. Configure
   Authentication → SMTP (or keep the built-in sender for testing) and add
   `https://your-domain/auth/activate` to Authentication → URL Configuration → Redirect URLs.
4. **Email confirmation** — leader sign-ups follow your project’s “Confirm email” setting. Teammate
   accounts are created server-side and activated through the emailed password-setup link.
5. **Service role** — `SUPABASE_SERVICE_ROLE_KEY` must be set on the server (Vercel env vars). It is
   used only by server routes for admin checks, invitations and the registration RPC.

### Google OAuth Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com).
2. Enable the Google+ API.
3. Add an Authorized Redirect URI:
   ```
   https://<your-project>.supabase.co/auth/v1/callback
   ```
4. Copy the Client ID and Client Secret.
5. In your Supabase project → Authentication → Providers → Google → enable and paste credentials.

---

## Creating the First Administrator

After running the migrations, promote a user to admin:

1. Register an account via the normal sign-up flow.
2. Open `supabase/bootstrap_admin.sql` and replace the placeholder email with your account email.
3. Run the script in the Supabase SQL Editor.

The user will have `admin` role access on the next login.

---

## Running the Application

```bash
# Development (hot reload)
npm run dev

# Production build
npm run build
npm start

# TypeScript type checking
npm run typecheck

# Lint
npm run lint
```

---

## Running Tests

```bash
# Run all tests once (CI mode)
npm test

# Watch mode (development)
npm run test:watch
```

Test files live in `test/`:
- `test/scoring.test.ts` — Core scoring & qualification engine
- `test/scoring.additional.test.ts` — Edge cases & policy variants
- `test/validation.test.ts` — Zod schema validation
- `test/validation.additional.test.ts` — Boundary & security input tests
- `test/registration-redesign.test.ts` — Solo / 1–3 member registration rules + username login
- `test/encryption.test.ts` — AES-256-GCM round-trip, tamper detection, answer stripping
- `test/integration.test.ts` — Integration tests (Branding, References, CSV parsing, 4-Round Tournament simulation)

---

## Competition Rounds Overview

| Round | Type | Format | Qualification |
|---|---|---|---|
| 1 | MCQ Screening | 5 questions, 30s each, online | Top 80% advance |
| 2 | MCQ Screening | 5 questions, 45s each, online | Top 4 advance |
| 3 | Rapid Fire | 3-minute session, 3s auto-skip, physical | Top 2 advance |
| 4 | Buzzer Final | 2 finalists, 10s answer window, physical | Champion declared |

---

## Deployment (Vercel + Supabase)

1. Push code to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Add all environment variables from `.env.example` in the Vercel project settings.
4. Set the **Root Directory** to the project folder if needed.
5. Deploy. Vercel builds `npm run build` and serves `npm start` automatically.

**Supabase**: Apply all migrations to your production Supabase project before the first deployment.

---

## Secure Question Bank

- Admins upload **CSV or XLSX** files from **Admin → Question Bank → Secure Encrypted Question Banks**.
  The existing single-row question importer is unchanged; this is the encrypted-bank workflow.
- Files are parsed and validated on the server, encrypted with **AES-256-GCM** (fresh IV + auth tag per
  upload) and stored as ciphertext in the private `question-banks` bucket. The key exists only in
  `QUESTION_BANK_ENCRYPTION_KEY`.
- **View** decrypts server-side for admins only. No IV, auth tag, ciphertext or key is ever returned to
  the browser, and the browser never receives the key.
- **Publish practice** requires a separate admin action and creates rows in `practice_questions` with
  option text only — correct answers are never copied. **Unpublish** removes them immediately.
- Published practice questions are available to everyone at `/practice`.
- Round questions are unaffected: participants still receive only the questions assigned to their
  active round, via server-side quiz APIs.

## Team Registration & Accounts

- A leader registers either **solo (1 member)** or a **team of 2–3 members** in one process from
  Dashboard → My Team.
- Team names are unique (case-insensitive). The per-university limit defaults to **6** and is editable
  in Admin → Registrations. Both rules are enforced inside Postgres with an advisory transaction lock,
  so simultaneous submissions cannot exceed the limit.
- Every member gets their own Supabase Auth account with their real email, a unique username and their
  own password. Teammates activate accounts through the emailed password-setup link (`/auth/activate`).
  Leaders never set or see teammate passwords.
- Username login is handled by `POST /api/auth/login`: the server resolves username → account with the
  service role, then signs in with the password. Errors are uniform to prevent username enumeration.
- Every member sees the same team progress in their own dashboard. Only the leader can edit team name,
  university and contact details before approval; roster/account emails are locked.
- Admins manage registrations grouped by university, edit/approve/reject/remove teams, and every action
  is written to `audit_logs`.

## Security Notes

- Answer keys (`is_correct`, `correct_option_id`) are **never** sent to the client.
- All scoring is evaluated server-side.
- Admin role assignment requires a running Supabase session with `is_admin()` returning `true`.
- The service role key is used only in server-side API routes and never in browser code.
- RLS is enforced on all database tables; encrypted-bank metadata is admin-only and the storage bucket
  is private with no client policies.
- Username lookup, decryption and practice publishing happen only in server routes.
- Audit logs are append-only and record all admin actions.

---

## Developer Credits

| Name | Registration | Role |
|---|---|---|
| Esha Minahil | SP24-BSE-010 | Developer |
| Seerat Rauf | SP24-BSE-027 | Developer |

---

© 2026 COMSATS VSPARK — Quiz Competition. All rights reserved.
