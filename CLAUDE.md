# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository. It is the single source of truth — spec, architecture, and developer reference — for the PRAJNA project.

---

## Project

PRAJNA (प्रज्ञा — *Deep Intelligence. Inner Wisdom.*) is a Professional AI Companion for GITAM University faculty across three campuses: Bengaluru, Visakhapatnam, Hyderabad. It tracks the full faculty lifecycle — teaching, research, FDPs, achievements, appraisals — and uses an AI companion engine to deliver personalized daily briefings, career coaching, leaderboards, and compliance readiness (NAAC/NBA/NIRF).

**Go-Live**: 30 June 2026. Phase 1 scope: Faculty lifecycle only. Phase 2: Students. Phase 3: University-wide.

---

## Current State

Greenfield. No application source code yet. Scaffolding only:
- `prisma/schema.prisma` — empty (no models defined yet)
- `prisma.config.ts` — Prisma 7 config
- `package.json` — dependencies only, no build/start/lint scripts yet

---

## Running TypeScript

ESM project (`"type": "module"`). Run TS files directly with `tsx`:

```bash
npx tsx src/index.ts
```

TypeScript config: `strict: true`, `module: ESNext`, `moduleResolution: bundler`, `target: ES2023`.

---

## Database & Prisma

PostgreSQL via `pg` + `@prisma/adapter-pg`. Prisma 7 uses `prisma.config.ts` (not `schema.prisma` datasource URL). Generated client outputs to `generated/prisma/` (gitignored). `DATABASE_URL` in `.env`.

```bash
npx prisma generate          # regenerate client after schema changes
npx prisma migrate dev       # create and apply a migration (dev)
npx prisma migrate deploy    # apply migrations (production)
npx prisma studio            # open DB browser
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js + Tailwind CSS + PWA |
| Backend | Node.js + TypeScript + Express |
| Database | PostgreSQL + Prisma ORM (AWS RDS) |
| AI Companion | Anthropic Claude API (primary) / OpenAI GPT-4 + rule-based fallback |
| File Storage | AWS S3 + CloudFront CDN (pre-signed URLs, virus scan on upload) |
| Auth | JWT + OAuth 2.0 + OTP MFA |
| Notifications | Nodemailer (email) + Meta WhatsApp Business API + Twilio (SMS) + in-app bell |
| Caching | Redis (AWS ElastiCache) |
| Monitoring | AWS CloudWatch + Sentry |
| CI/CD | GitHub Actions + Docker |
| Reports | Puppeteer (PDF) + SheetJS (Excel) |

Architecture: **Modular Monolith** for Phase 1. Clear migration path to microservices in Phase 3.

---

## Roles & Access Control

6 roles with row-level DB security isolating data by campus and role:

| Role | Scope |
|---|---|
| Faculty | Own profile and data only |
| HoD | All faculty in their department |
| Dean / School Head | All departments in their school |
| Director | All 3 campuses (Central Authority) |
| IQAC Coordinator | Read-only compliance view across school |
| System Admin (CATS) | Full system: users, audit logs, integrations, health |

OTP MFA enforced for admin roles.

---

## PRAJNA Score Engine

Live composite faculty excellence index, computed in real time as data is entered and approved.

| Dimension | Weight | What Is Measured |
|---|---|---|
| Research & Innovation | 30% | Publications (SCI > Scopus > others), patents, grants, Ph.D. scholars, consultancy |
| Teaching Excellence | 25% | Attendance %, feedback score, lesson plan compliance, remedial sessions, CO-PO completion |
| Professional Development | 20% | FDPs, MOOCs, certifications, international exposure, workshops organized |
| Achievements & Recognition | 10% | Awards, invited talks, editorial roles, media mentions, professional body leadership |
| Administrative Contribution | 10% | Committee roles, mentoring, exam duties, IQAC, placement activities |
| Profile Completeness Bonus | 5% | Bonus for fully updated profile |

**Tiers**: Bronze (0–40) → Silver (41–60) → Gold (61–80) → Platinum (81–95) → PRAJNA Fellow (96–100)

Faculty must see their tier, score breakdown by dimension, and exactly what actions will move them up.

---

## AI Companion Engine

The core differentiator. Powered by LLM API (Claude/GPT-4) with a mandatory rule-based fallback that activates automatically when the API is unavailable.

| Capability | Trigger | What It Does |
|---|---|---|
| Morning Briefing | Login | Personalized daily agenda: classes today, pending approvals, deadlines, goal % |
| Achievement Celebration | Every approved publication/FDP/award | Personalized congratulations + score update |
| Career Gap Analysis | On demand / weekly | Gap to next promotion + peer benchmarks + actionable micro-steps |
| End-of-Day Sign-Off | "End My Day" click or 30-min idle | Day summary + tomorrow's #1 priority + goodnight message |
| Free-form AI Chat | Any time | Career, research, score improvement guidance |
| Workload Advisor | Continuous | Flags teaching/research/admin imbalance vs. dept average |
| Opportunity Spotter | Background | Upcoming conferences, grant deadlines, FDPs matching research area |

**Privacy rule (non-negotiable)**: AI chat conversations are private to the faculty member only. They must never be visible to HoD, Dean, or Director under any circumstance. Faculty must explicitly consent to any data sharing.

Each AI response is built from the faculty's live PRAJNA profile (prompt engineering). Tone: encouraging, warm, specific, action-oriented.

---

## Faculty Data Clusters

Six clusters capture the complete 360° faculty lifecycle:

| # | Cluster | Key Fields |
|---|---|---|
| 1 | Personal & Professional Profile | Name, DOB, employee ID, designation, campus, qualifications, ORCID/Scopus/Scholar IDs, VIDWAN ID, LinkedIn, photo |
| 2 | Course Deliverables & Teaching | Courses, timetable, contact hours, attendance, lesson plans, CO-PO mapping, CIA/end-sem marks, feedback scores, remedial records, faculty advisor logs |
| 3 | Research & Innovation | Journal/conference papers (DOI, indexing, IF), books, funded projects (PI/Co-PI), patents, Ph.D. scholars, consultancy, MoUs, technology transfers |
| 4 | Achievements & Recognition | Awards (all levels), invited talks, professional body memberships, editorial/reviewer roles, media coverage, fellowships |
| 5 | Faculty Development & Growth | FDPs attended/organized, MOOCs/NPTEL, workshops, boot camps, international visits |
| 6 | Administrative & Lifecycle | Onboarding docs, leave records, APAR, API score (UGC CAS), promotion eligibility, committee roles, exam duties, exit records |

---

## Approval Workflows

Every data type has a defined owner (enters) and approver chain (validates):

| Data Type | Entered By | L1 Approver | L2 Approver | Final Owner |
|---|---|---|---|---|
| Publications (Journals) | Faculty | HoD | Dean (SCI/Scopus) | IQAC / PRAJNA DB |
| Conference Papers | Faculty | HoD (final) | — | Faculty Profile |
| Research Grants | Faculty | HoD | Dean | R&D Registry |
| Patents | Faculty | HoD | Dean + Director | IP Registry |
| Teaching Workload | HoD (assigns) | Faculty (confirms) | Auto-approved | Official Timetable |
| FDP Certs | Faculty | HoD (7-day window; **auto-approve** if no action) | — | Faculty Profile |
| APAR | Faculty (self) | HoD | Dean | Director / HR |
| Awards & Achievements | Faculty | HoD (7-day window) | — | Faculty Profile |
| Leave Records | Faculty (applies) | HoD (approves) | — | HR System |

Auto-escalation fires if approvers miss deadlines. All auto-approvals are logged in the audit trail.

---

## Notification & Escalation Logic

Channels: Email + WhatsApp + SMS + in-app bell. Idempotency key prevents duplicate sends. Retry 3× on failure; fallback to in-app only.

| Trigger | Day 0 | Day 3–7 | Day 10+ | Escalation Path |
|---|---|---|---|---|
| APAR not submitted | Notify Faculty | Reminder D7 | Escalate D25 | Faculty → HoD (D25) → Dean (D28) → Director (D30) |
| Publication pending HoD approval | HoD notified | Reminder D3 | Escalate D7 | HoD → Dean (auto-approve after D10) |
| FDP cert pending | HoD notified | Reminder D3 | Auto-approve D7 | Auto-approve with log; faculty notified |
| Profile < 60% complete | Faculty nudge | Weekly nudge | HoD CC'd D30 | Appears as 'Incomplete Profile' on HoD dashboard |
| Feedback score < 3.0 | Faculty notified | — | HoD alerted | HoD counselling flag; action report requested |
| No research activity 90 days | — | PRAJNA nudge | HoD alert | AI suggests 3 specific actions |
| Promotion eligibility reached | Faculty celebrated | — | HoD & Director | Celebration message + next steps |

---

## Leaderboard

- **Department**: visible to all faculty in dept + HoD
- **School**: visible to Dean + Director
- **Cross-campus**: Director only
- Shows: rank, PRAJNA Score, tier badge, biggest achievement this month
- Monthly reset for short-term; all-time leaderboard for legacy recognition
- Design principle: **inspire, not shame** — bottom performers see encouragement, not punishment
- Director can send personal appreciation badges — visible on recipient's profile

---

## Key Process Workflows

### Publication Entry (DOI auto-fetch)
1. Faculty enters DOI → PRAJNA auto-fetches title, journal, IF, authors, year via CrossRef/Scopus API
2. System checks for duplicate (same DOI or same title + year + any common author) → shows side-by-side if found
3. Faculty confirms, uploads PDF proof, submits → Status: Pending HoD Approval
4. HoD approves/rejects → SCI/Scopus auto-escalates to Dean; conference papers stop at HoD
5. On final approval → PRAJNA sends celebration message + score update

### APAR Annual Appraisal
1. Auto-triggered every March 1 — 30-day window opens; PRAJNA pre-fills known data
2. Faculty fills self-appraisal with AI-suggested content per field
3. Escalating reminders at D15 and D25
4. Sequential review: Faculty → HoD → Dean → Director/HR (each with defined window; auto-escalation on miss)
5. API Score calculated (UGC CAS formula) → promotion eligibility flag set

### End-of-Day Sign-Off
1. Faculty clicks "End My Day" or session is idle 30 min
2. PRAJNA compiles day's activity and generates personalized summary
3. Optional: faculty rates the day / adds private reflection (stored privately; used to calibrate future tone)
4. Goodnight message sent

---

## External Integrations

| Integration | Purpose | On API Failure |
|---|---|---|
| CrossRef / Scopus | DOI auto-fetch for publications | Show manual entry form |
| GITAM Portal | No feature duplication (scope confirmed in kickoff demo) | PRAJNA runs standalone |
| HR / Leave System | Sync leave data (PRAJNA is **read-only**) | Show last-synced timestamp; manual override |
| LMS (Moodle) | Course/assessment data | Manual entry flagged as 'Unsynced' |
| AI API (Claude/GPT-4) | Companion chat, briefings, summaries | **Rule-based fallback activates automatically** |
| WhatsApp Business API | Notifications + escalations | Retry 3×; fallback to in-app only |

---

## Data Validation Rules

| Field | Rule |
|---|---|
| DOI | Must match `10.XXXX/XXXXX` format |
| ISSN | Must match `XXXX-XXXX` format |
| ISBN | Must be 13 digits |
| Completion dates | Cannot be a future date |
| File uploads | PDF/JPG/PNG only, max 5MB, virus scanned on upload |
| Duplicate publications | Same DOI OR (title + year + common author) → side-by-side comparison, confirmation required |
| Duplicate FDP/events | Same event name + dates for same faculty → warning + typed override reason (audit logged) |

---

## Role-Specific Dashboards

**Faculty**: today's priorities, PRAJNA Score + tier + breakdown, pending tasks, deadlines, rank, career roadmap.

**HoD**: all faculty profiles + completion %, approval queue, workload balance, flagged faculty (low feedback / stagnant / missed deadlines), one-click dept report.

**Dean / School Head**: school-level aggregation, approval authority for SCI/patents/Ph.D., faculty distribution analysis (research-active vs. teaching-only vs. admin-heavy).

**Director Command Centre**: 3-campus side-by-side view, real-time activity pulse, Inspection Readiness Score per dept (0–100%), cross-campus benchmarking, top performers leaderboard, promotion eligibility flags, weekly auto-emailed Executive Summary (Mondays), ability to send appreciation badges.

**IQAC Coordinator**: Inspection Readiness Score per dept/school/campus, one-click NAAC Criteria I–VII report, NBA OBE report (CO-PO auto-filled), NIRF export, data gap highlighting, year-over-year historical comparison.

**System Admin (CATS)**: user management, audit log access, system health (uptime/API health/error rates), backup management, integration enable/disable.

---

## Report Generation

- NAAC (Criteria I–VII), NBA OBE, NIRF — one-click, auto-populated from live data
- Custom analytics (any date range / dept / campus)
- Output: PDF via Puppeteer, Excel via SheetJS
- Target: < 10 seconds generation time

---

## Data Migration

- Excel import templates with validation macros provided per department
- Pre-2020 data imported as `Archived` status — visible, not editable
- All records tagged: `Migrated` vs `Native` for audit trail
- Records with missing mandatory fields are flagged, not auto-imported
- Target: 85% clean on first run; 15% manually reviewed
- Original Excel files preserved in S3 for 7 years

---

## Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Dashboard load < 2s; report generation < 10s; AI companion response < 5s |
| **Availability** | 99.5% uptime; scheduled maintenance Sundays 2–5 AM only |
| **Scalability** | Must support 10,000+ users (Phase 3) without architecture redesign |
| **Security** | AES-256 at rest; TLS 1.3 in transit; OTP MFA for admin; OWASP ZAP + pen test |
| **Privacy** | AI chat private to faculty; explicit consent required for any data sharing |
| **Data Integrity** | Immutable audit trail for every change; no permanent deletion — archival only; NAAC compliant |
| **Mobile First** | PWA — fully functional on mobile; attendance + certificate upload optimized for mobile |
| **Backup** | Daily automated backups; point-in-time recovery; 7-year retention (UGC norms) |
| **Compliance** | NAAC Criteria I–VII, NBA OBE, UGC CAS formula, NIRF data model |
