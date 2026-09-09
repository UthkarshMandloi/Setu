# Setu — SIH 2026 · PS SIH26136 (Govt of Maharashtra)

Government-Startup Innovation Procurement Exchange prototype. Government departments post problems; verified startups pitch solutions; pilots run against agreed KPIs; AI drafts legal/pilot documents; KPI results generate ROI, colour-coded trust badges, and reusable Solution Passports for a marketplace adoption flow.

## What is built

| Module | Status | What works |
|---|---|---|
| Auth + Layout Shell | ✅ | Standard login (`email` + `password123`) + simulated DigiLocker mock login; role-based routing (`STARTUP`, `GOV_OFFICER`, `GOV_ADMIN`, `PLATFORM_ADMIN`, `CITIZEN`); government portal navbar/sidebar |
| Startup Verification | ✅ | Document upload (`public/uploads`), AI extraction (simulated with Gemini mock fallback), eligibility scoring (20% incorporation, 25% DPIIT, 15% PAN, 15% GST, 15% financials, 10% conflicts) |
| Problems + Pitching | ✅ | Officer creates problems; startups submit pitches; officer selects/rejects; audit log recorded |
| Pilot + KPIs + Legal Assistant | ✅ | Officer creates pilots on selection; KPI definitions; AI legal draft assistant (`Pilot Agreement`, `NDA`, `MoU`, `Data-Sharing`, `IP Licensing`); `.docx` export via `docx` package; simulated badges shown |
| Scoring + Solution Passport | ✅ | `calculateScore.ts`: KPI achievement % (respect `direction`: `HIGHER_IS_BETTER` / `LOWER_IS_BETTER`), ROI `((measuredBenefit - budget) / budget) * 100`, trust badge (`GREEN` ≥80, `YELLOW` 50-79, `RED` <50), `SolutionPassport` creation |
| Marketplace + Reuse | ⚠️ Partial | `SolutionPassport` table + `MarketplaceRequest` exist; `/marketplace` page not fully wired; open/proprietary IP fields in schema |
| Community Problem Reporting | ⚠️ Partial | `UnregisteredProblem` table + seed data; public report form + admin "Adopt into Registry" action not fully wired |
| Notifications + Audit Log | ⚠️ Partial | `AuditLog` table exists; audit entries created on pitch selection/rejection; in-app notification list not fully wired |

## Tech stack

- **Framework:** Next.js 14 (App Router), TypeScript, React Server Components where sensible, Server Actions for mutations
- **Styling:** Tailwind CSS + shadcn/ui components; navy `#1B3A6B` + saffron `#D97706` government-portal theme
- **DB:** SQLite via Prisma ORM (`prisma/schema.prisma`) — schema designed for one-line swap to PostgreSQL
- **Auth:** NextAuth.js (Credentials provider) — standard form + simulated DigiLocker mock consent
- **AI:** Google Gemini (`gemini-1.5-flash`) via `@google/generative-ai`; always falls back to canned mock response if `GEMINI_API_KEY` missing
- **Charts:** Recharts (`recharts`) — KPI comparison and ROI visuals
- **Documents:** `docx` npm package for `.docx` export; simulated DigiLocker/integration badges shown in UI
- **Uploads:** local disk under `/uploads` (served via route)
- **Package manager:** npm

## How to run

1. **Environment**
```bash
cp .env.example .env   # or create .env manually
```
`.env` contents:
```env
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="<your-key-or-leave-empty-for-mock>"
NEXTAUTH_SECRET="<random-string>"
NEXTAUTH_URL="http://localhost:3000"
```

2. **Install + migrate + seed**
```bash
npm install
npx prisma db push      # creates schema in SQLite
npx prisma db seed      # populates demo departments, users, startups, problems, pitches, pilots, passports
```

3. **Dev server**
```bash
npm run dev
```
App runs at `http://localhost:3000`.

4. **Demo accounts** (password: `password123`)
- Officer: `officer.mh@gov.in`
- Admin: `admin.mh@gov.in`
- Startup: `founder1@cropai-tech.com` (or any `founderN@...` from seed)

5. **DigiLocker mock login** — click the DigiLocker tab on `/login`; returns a simulated verified identity with a "Simulated for demo" badge.

## What is remaining / not fully wired

- **Marketplace page** (`/marketplace`) — browse passports, request assignment from second department, Open-IP assignment to similar startup
- **Community reporting UI** (`/report-problem`) — public form for unregistered problems; admin "Adopt into Registry" moderation queue
- **In-app notifications** — list page and real-time updates
- **Full `.docx` export integration** — draft generation works via `docx`; download endpoint can be added
- **Pitch summarisation** — optional Gemini-based short summary alongside pitch text (do last if time allows)
- **Recharts visualisation** — full KPI-vs-actual chart rendering on pilot pages

## File structure highlights

- `prisma/schema.prisma` — full entity model (`User`, `StartupProfile`, `Document`, `Department`, `Problem`, `Pitch`, `Pilot`, `KPI`, `KPIResult`, `LegalDocument`, `SolutionPassport`, `MarketplaceRequest`, `UnregisteredProblem`, `AuditLog`)
- `prisma/seed.ts` — realistic Indian government/startup demo data (4-6 departments, 10 startups with varied verification states, 15 problems, 8 pitches, 4 pilots including GREEN, YELLOW, RED, 3 passports, 1 marketplace request, 2 unregistered problems)
- `src/lib/auth.ts` — NextAuth with both login flows + session propagation
- `src/lib/scoring/calculateScore.ts` — scoring algorithm
- `src/lib/scoring/eligibility.ts` — eligibility scoring algorithm (if separate file exists; otherwise in verification module)
- `src/app/gov/pilots/actions.ts` — server actions for metrics + passport generation
- `src/app/gov/pilots/page.tsx` — pilot list with stats cards

## Notes / assumptions

- All simulated integrations (DigiLocker, document registries) show a small "Simulated for demo" badge in the UI — never labelled as real.
- AI outputs always include a note: "AI-assisted, simulated for demo" or "AI-generated draft — have a lawyer review before signing."
- The repo has `.claude/settings.json` with `defaultMode: "acceptEdits"`; common commands (`npm install`, `prisma db push/seed`, `npm run dev`) run without approval prompts.
- No external cloud storage — uploads serve from `/uploads`.
