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
| `NEXT_PUBLIC_APP_URL` | App base URL (e.g. `https://nexora.vercel.app`) |
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
```

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

## Security Notes

- Answer keys (`is_correct`, `correct_option_id`) are **never** sent to the client.
- All scoring is evaluated server-side.
- Admin role assignment requires a running Supabase session with `is_admin()` returning `true`.
- The service role key is used only in server-side API routes and never in browser code.
- RLS is enforced on all 22 database tables.
- Audit logs are append-only and record all admin actions.

---

## Developer Credits

| Name | Registration | Role |
|---|---|---|
| Esha Minahil | SP24-BSE-010 | Developer |
| Seerat Rauf | SP24-BSE-027 | Developer |

---

© 2026 COMSATS VSPARK — Quiz Competition. All rights reserved.
