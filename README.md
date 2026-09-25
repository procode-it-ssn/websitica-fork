# Websitica — Invente '26 Tournament System

> Professional, low-latency, real-time tournament management and live arena platform built for **Invente '26**, the annual national technical symposium of SSN & SNUC.

---

## 🎯 System Overview

**Websitica** is a high-performance tournament management and live interactive gaming system. It powers multi-round technical competitions with real-time puzzle matching (Codections), offline design replications, interactive bidding arenas, live auditorium projector boards, and full tournament candidate administration.

Built with a **Neo-Brutalist retro VHS Walkman aesthetic** faithful to the official Invente design system.

---

## 🏆 Tournament Architecture & Rounds

Websitica coordinates the full lifecycle of a multi-stage competitive event:

### 1. Pre-Registration & Candidate Directory
- **Searchable Candidate Roster**: Autocomplete directory imported from verified college registration spreadsheets.
- **Squad Binding**: Automatic locking prevents duplicate participant selections across squads.
- **Passkey Generation**: Unique cryptographic-style `WS-XXXX` passkeys for squad authentication.

### 2. Round 1: Chaos by Design (Website Replication)
- **Live Scoring Matrix**:
  - Visual Design & Polish (Max: 30 PTS)
  - UX & Responsiveness (Max: 35 PTS)
  - Technical Execution & Clean Code (Max: 35 PTS)
- **Real-time Recount**: Live synchronization with squad total and grand tournament scores.

### 3. Round 1: Codections Arena (Word Puzzle Matching)
- **4x4 Thematic Sector Grid**: Real-time thematic word connections matching.
- **Concurrent Player Gameplay**: Both squad contestants can play individually and combine their scores.
- **Live Arena Feed**: Instant auditorium broadcast formatted as `[Participant Name] [Squad • Lab X]`.
- **Race-Condition Protection**: Atomic submission locks and per-player completion tokens prevent duplicate submissions.
- **Quit / Exit Round**: Dedicated button with confirmation modal allowing contestants to safely exit to the waiting room with their earned score preserved.

### 4. Round 1: Dynamic Bidding Arena
- **Interactive Scoring Controls**: Fast $+/-$ point adjustments per question.
- **Audit Logging**: Full question-by-question transaction history saved to PostgreSQL `bidding_history`.
- **Immediate Propagation**: Bidding adjustments instantly update R1 Total and Grand Total across all views.

### 5. Round 2: Replica Rush Finals
- **Criteria Sliders**: Accuracy (30), Responsiveness (30), Code Quality (25), Communication (15), and Aura Points (15).
- **Auto-Qualified Filter**: Focus mode displaying only squads promoted to the finals.

### 6. Leaderboard & Next Round Qualifier
- **Ranked Multi-Criteria Sorting**: Sort by Grand Total, R1 Combined Total, Codections, Web UI, Bidding, or R2 Finals.
- **Next Round Selection Tools**: Batch qualify `TOP 5`, `TOP 10`, `TOP 16`, or any custom $N$ cutoff.
- **Manual Promotion / Demotion**: Individual per-team qualification toggles.
- **📺 Projector Scoreboard**: High-contrast, distraction-free live presentation leaderboard for auditorium projection.
- **Excel (.xlsx) Export**: One-click complete export of tournament standings, participant details, and score breakdowns.

---

## 🔐 Security & Access Control

- **Protected Administrative Deck**: Direct access to `/admin` without authentication is strictly blocked. Unauthenticated visits are automatically redirected to `/login` via server-side Supabase session guards.
- **Separation of Roles**: Contestants access the player arena via passkey authentication; coordinators manage scores via verified coordinator credentials.
- **Mock Mode vs Production Mode**:
  - `NEXT_PUBLIC_MOCK_MODE=false`: Production mode connected to Supabase PostgreSQL and Realtime WebSocket channels.
  - `NEXT_PUBLIC_MOCK_MODE=true`: Local offline development mode with mock data fixtures.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router, Server Actions, SSR) |
| **Styling** | Tailwind CSS + Neo-Brutalist Design Tokens |
| **Realtime / DB** | [Supabase](https://supabase.com/) (PostgreSQL + Realtime Channels + Auth) |
| **Data Export** | SheetJS ([xlsx](https://www.npmjs.com/package/xlsx)) |
| **Icons & Motion** | [Lucide React](https://lucide.dev/) + [Framer Motion](https://www.framer.com/motion/) |
| **Deployment** | [Vercel](https://vercel.com/) |

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js 18.17+ or 20+
- An active Supabase project with required schema migrations

### 2. Clone and Install
```bash
git clone https://github.com/procode-it-ssn/websitica-fork.git
cd websitica-fork
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your credentials:
```env
NEXT_PUBLIC_MOCK_MODE=false
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 4. Database Setup
Execute the migration scripts located in `supabase/migrations/` in your Supabase SQL Editor:
1. `0001_add_lab_column.sql` — Adds lab partitioning.
2. `0002_candidates_and_bidding.sql` — Adds candidates directory, passkeys, multi-round scoring fields, and bidding history.

### 5. Run the Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) for the contestant portal, or [http://localhost:3000/login](http://localhost:3000/login) for the administrative console.

---

## ☁️ Production Deployment on Vercel

### Step-by-Step Vercel Setup:

1. **Push to GitHub**:
   Push your clean repository branch to GitHub. Sensitive files (`.env*.local`, participant spreadsheets `*.xlsx`, logs) are automatically excluded by `.gitignore`.

2. **Import Project to Vercel**:
   - Go to [vercel.com](https://vercel.com/) and click **Add New** $\rightarrow$ **Project**.
   - Select your `websitica-fork` repository.

3. **Configure Environment Variables**:
   In the Vercel project configuration, add the following under **Environment Variables**:
   - `NEXT_PUBLIC_MOCK_MODE` = `false`
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-anon-key`
   - `SUPABASE_SERVICE_ROLE_KEY` = `your-service-role-key`

4. **Deploy**:
   - Framework Preset: **Next.js**
   - Root Directory: `./`
   - Click **Deploy**. Vercel will build and deploy the production bundle with Edge CDN routing.

---

## 📁 Repository Structure

```
websitica-fork/
├── app/
│   ├── (admin)/               # Administrative console
│   │   ├── admin/             # Tournament Master Deck
│   │   │   ├── layout.js      # Server-side auth guard (redirects to /login)
│   │   │   └── page.js
│   │   └── login/             # Coordinator sign-in
│   ├── (main)/                # Contestant client application
│   │   ├── game/              # Round 1 Codections puzzle arena
│   │   ├── waiting/           # Live waiting lounge & tape calibrator
│   │   ├── lab1/ & lab2/      # Lab venue quick-routing
│   │   └── page.js            # Squad registration & passkey login
│   ├── globals.css            # Neo-Brutalist themes & animations
│   └── layout.js
├── components/
│   ├── AdminDashboard.js      # Master control console & sessions deck
│   ├── AdminCandidates.js     # Participant candidate roster & excel upload
│   ├── AdminRound1Web.js      # Round 1 website replication marking
│   ├── AdminCodections.js     # Round 1 individual participant scoring
│   ├── AdminBidding.js        # Round 1 live question bidding arena
│   ├── AdminRound2.js         # Round 2 Replica Rush finals evaluation
│   ├── AdminReport.js         # Leaderboard, Next Round Qualifier & Projector
│   ├── JoinGame.js            # Squad registration, candidate selector & auth
│   ├── PlayerGame.js          # Codections puzzle grid with quit confirmation
│   └── InventeBackground.js   # Retro Invente aesthetic canvas
├── lib/                       # Supabase client, server utilities & mock data
└── supabase/migrations/       # Database schemas & SQL migrations
```

---

## 🤝 Project Maintenance

Maintained by **ProCode IT Club — SSN & SNUC** for **Invente '26**.
