# Websitica — Invente '26 Quiz Platform

> Real-time multiplayer quiz platform built for **Invente '26**, the annual technical fest of SSN & SNUC.

---

## 🎯 Overview

Websitica is a live, real-time quiz game platform that powers the Invente '26 tech fest experience. Players join game rooms, answer questions in real-time, and compete on live leaderboards — all wrapped in a retro VHS-inspired UI faithful to the official Invente aesthetic.

---

## ✨ Features

- 🎮 **Real-time multiplayer quiz** — players join via a room code
- 📡 **Live leaderboard** — scores update instantly using Supabase Realtime
- 🎨 **Invente-themed UI** — retro VHS tapes, smiley badge, and crosshair markers matching [ssnsnucinvente.com](https://ssnsnucinvente.com/)
- 🔐 **Admin dashboard** — create and manage games, push questions, control game flow
- ⚡ **Low-latency** — built with Supabase Realtime channels for sub-second updates
- 📱 **Responsive** — works across desktop and mobile

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Styling | Tailwind CSS + Vanilla CSS animations |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Backend / DB | [Supabase](https://supabase.com/) (PostgreSQL + Realtime) |
| Auth | Supabase Auth |
| Deployment | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project

### 1. Clone the repository

```bash
git clone https://github.com/procode-it-ssn/websitica-fork.git
cd websitica-fork
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
websitica-fork/
├── app/                    # Next.js App Router pages
│   ├── (main)/             # Player-facing routes
│   │   ├── game/           # Active game page
│   │   └── waiting/        # Waiting room page
│   └── (admin)/            # Admin-only routes
│       ├── admin/          # Dashboard
│       └── login/          # Admin login
├── components/             # Reusable React components
│   ├── InventeBackground.js  # Decorative VHS/smiley background
│   ├── JoinGame.js           # Player join flow
│   ├── PlayerGame.js         # In-game UI for players
│   ├── PlayerWaiting.js      # Waiting room UI
│   └── AdminDashboard.js     # Admin control panel
├── context/                # React context providers
├── hooks/                  # Custom React hooks
├── lib/                    # Supabase client & utilities
├── public/
│   └── invente/            # Invente brand assets (SVGs, WebPs)
└── supabase/               # Supabase schema / migrations
```

---

## 🎨 Design

The UI is inspired by the official [Invente '26 website](https://ssnsnucinvente.com/) and uses:

- **Colour palette**: `#faf9f5` (background), `#fe90e9` (pink), `#9ae885` (lime), `#c1f8ff` (sky), `#f7cb46` (mustard), `#1f1b12` (ink)
- **VHS tape decorations** floating at screen edges with subtle parallax animation
- **Spinning smiley badge** (16s linear infinite, matching the official site)
- **Retro crosshair text markers** for that extra tape-era feel

---

## 🔧 Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 🤝 Contributing

This project is maintained by the **ProCode IT Club — SSN & SNUC**.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is private and maintained for internal use by ProCode IT Club, SSN & SNUC.

---

<div align="center">
  Made with ❤️ by <strong>ProCode IT Club</strong> · SSN & SNUC · Invente '26
</div>
