# Setu — SIH 2026 · PS SIH26136 (Govt of Maharashtra)

Government-Startup Innovation Procurement Exchange prototype. Government departments post problems; verified startups pitch solutions; pilots run against agreed KPIs; AI drafts legal/pilot documents; KPI results generate ROI, colour-coded trust badges, and reusable Solution Passports for a marketplace adoption flow.

## What is built

| Module | Status | What works |
|---|---|---|
| Auth + Layout Shell | ✅ Complete | Standard login (`email` + `password123`) + simulated DigiLocker mock login; role-based routing (`STARTUP`, `GOV_OFFICER`, `GOV_ADMIN`, `PLATFORM_ADMIN`, `CITIZEN`); government portal navbar/sidebar |
| Startup Verification | ✅ Complete | Document upload (`public/uploads`), AI extraction (simulated with Gemini mock fallback), eligibility scoring (20% incorporation, 25% DPIIT, 15% PAN, 15% GST, 15% financials, 10% conflicts) |
| Problems + Pitching | ✅ Complete | Officer creates problems; startups submit pitches; officer selects/rejects; audit log recorded |
| Pilot + KPIs + Legal Assistant | ✅ Complete | Officer creates pilots on selection; KPI definitions; AI legal draft assistant (`Pilot Agreement`, `NDA`, `MoU`, `Data-Sharing`, `IP Licensing`); `.docx` export via `docx` package; simulated badges shown |
| Scoring + Solution Passport | ✅ Complete | `calculateScore.ts`: KPI achievement % (respect `direction`: `HIGHER_IS_BETTER` / `LOWER_IS_BETTER`), ROI `((measuredBenefit - budget) / budget) * 100`, trust badge (`GREEN` ≥80, `YELLOW` 50-79, `RED` <50), `SolutionPassport` creation |
| Marketplace + Reuse | ✅ Complete | Browse passports at `/marketplace`; view details; "Request Assignment" from second department; open/proprietary IP status; marketplace request workflow |
| Community Problem Reporting | ✅ Complete | Public form at `/report-problem`; admin moderation queue at `/admin/community`; "Adopt into Registry" action creates official Problem with `sourceType: COMMUNITY` |
| Notifications + Audit Log | ✅ Complete | In-app notifications at `/notifications`; mark all read; audit log at `/admin/audit-log` with full action history; `Notification` model with type-based styling |

## Tech stack

- **Framework:** Next.js 14 (App Router), TypeScript, React Server Components where sensible, Server Actions for mutations
- **Styling:** Tailwind CSS + shadcn/ui components; navy `#1B3A6B` + saffron `#D97706` government-portal theme
- **DB:** PostgreSQL (hosted on Aiven) via Prisma ORM (`prisma/schema.prisma`, migrations in `prisma/migrations/`)
- **Auth:** NextAuth.js (Credentials provider) — standard form + simulated DigiLocker mock consent
- **AI:** Google Gemini (`gemini-1.5-flash`) via `@google/generative-ai`; always falls back to canned mock response if `GEMINI_API_KEY` missing
- **Charts:** Recharts (`recharts`) — KPI comparison and ROI visuals
- **Documents:** `docx` npm package for `.docx` export; simulated DigiLocker/integration badges shown in UI
- **Uploads:** local disk under `/uploads` (served via route)
- **Package manager:** npm

## How to run

1. **Environment** — copy the template and fill in real values (ask the team for the Aiven connection string):
```bash
cp .env.example .env
```
`.env` is git-ignored — never commit it.
```env
DATABASE_URL="postgres://avnadmin:<password>@<host>.aivencloud.com:<port>/defaultdb?sslmode=require"
GEMINI_API_KEY="<your-key-or-leave-empty-for-mock>"
NEXTAUTH_SECRET="<random-string>"
NEXTAUTH_URL="http://localhost:3000"
```

2. **Install**
```bash
npm install                 # also runs prisma generate
npx prisma migrate deploy   # applies any pending migrations (safe, non-destructive)
```
The shared Aiven database already contains the demo data. `npx prisma db seed` **deletes every table** before re-inserting demo data — only run it if you deliberately want to reset the shared DB.

3. **Dev server**
```bash
npm run dev
```
App runs at `http://localhost:3000`.

4. **Demo accounts** (password: `password123`)
- Officer: `officer.mh@gov.in` (Maharashtra) · `officer.ka@gov.in` (Karnataka)
- Gov Admin: `admin.mh@gov.in`
- Platform Admin: `admin@setu.gov.in`
- Startup: `founder1@cropaitech.com` (Verified) · `founder5@finflowai.com` (Needs Review) · `founder6@ecowastemanagement.com` (Rejected)

5. **DigiLocker mock login** — click the DigiLocker tab on `/login`; returns a simulated verified identity with a "Simulated for demo" badge.

## Changing the schema

`prisma migrate dev` does not work against Aiven (its shadow-database cleanup needs superuser). Instead:
```bash
# 1. edit prisma/schema.prisma
# 2. generate the SQL for the change into a new migration folder
mkdir prisma/migrations/<YYYYMMDDHHMMSS>_<name>
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma --to-schema-datamodel prisma/schema.prisma --script > prisma/migrations/<YYYYMMDDHHMMSS>_<name>/migration.sql
# 3. apply + regenerate the client
npx prisma migrate deploy
npx prisma generate
```

## Deployment (Vercel)

🚀 **Live Production Application**: [https://setu-theta-ten.vercel.app](https://setu-theta-ten.vercel.app)

`vercel.json` builds with `prisma generate && prisma migrate deploy && next build` — pending migrations are applied on deploy, but the build never seeds. Set these in Vercel → Project → Settings → Environment Variables: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (the production URL), `GEMINI_API_KEY`.

## What is remaining / not fully wired

- **Gemini AI integration** — mock fallback works; wire real `GEMINI_API_KEY` for production document extraction and legal drafting
- **`.docx` download endpoint** — add route to serve generated documents
- **Recharts visualisation** — full KPI-vs-actual chart rendering on pilot detail pages
- **Pitch summarisation** — optional Gemini-based short summary alongside pitch text
- **File upload storage** — currently local `/uploads`; wire cloud storage for production

## File structure highlights

- `prisma/schema.prisma` — full entity model (`User`, `StartupProfile`, `Document`, `Department`, `Problem`, `Pitch`, `Pilot`, `KPI`, `KPIResult`, `LegalDocument`, `SolutionPassport`, `MarketplaceRequest`, `UnregisteredProblem`, `AuditLog`)
- `prisma/seed.ts` — realistic Indian government/startup demo data (4-6 departments, 10 startups with varied verification states, 15 problems, 8 pitches, 4 pilots including GREEN, YELLOW, RED, 3 passports, 1 marketplace request, 2 unregistered problems)
- `src/lib/prisma.ts` — shared Prisma client singleton
- `src/lib/auth.ts` — NextAuth with both login flows + session propagation
- `src/lib/scoring/calculateScore.ts` — scoring algorithm
- `src/lib/scoring/eligibility.ts` — eligibility scoring algorithm
- `src/app/gov/pilots/actions.ts` — server actions for metrics + passport generation
- `src/app/gov/pilots/page.tsx` — pilot list with stats cards

## Notes / assumptions

- All simulated integrations (DigiLocker, document registries) show a small "Simulated for demo" badge in the UI — never labelled as real.
- AI outputs always include a note: "AI-assisted, simulated for demo" or "AI-generated draft — have a lawyer review before signing."
- The repo has `.claude/settings.json` with `defaultMode: "acceptEdits"`; common commands (`npm install`, `prisma migrate deploy`, `npm run dev`) run without approval prompts.
- No external cloud storage — uploads serve from `/uploads`.
