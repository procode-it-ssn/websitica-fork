// Mock data utilities for rapid UI/UX theming without database dependencies
// Opt-in ONLY. Never infer this from missing/placeholder env vars, and never
// allow it in a production build: this flag disables the admin auth guard
// (see app/(admin)/admin/layout.js), so inferring it makes the app fail open.
export const IS_MOCK_MODE =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_MOCK_MODE === "true";

export const DEFAULT_MOCK_PLAYER = {
  id: "mock-player-1",
  name: "Cyber Alchemist",
};

export const DEFAULT_MOCK_TEAM = {
  id: "mock-team-1",
  name: "Steam Coders",
  lab: 1,
  score: 1250,
  player_count: 3,
};

export const MOCK_CATEGORIES_DATA = {
  "Frontend Frameworks": ["React", "Vue", "Svelte", "Angular"],
  "Databases": ["PostgreSQL", "MongoDB", "Redis", "Cassandra"],
  "CSS Units": ["rem", "vh", "em", "px"],
  "Programming Languages": ["Python", "Rust", "TypeScript", "Go"],
  "Browser Dev Tools": ["Console", "Network", "Elements", "Sources"],
  "Web Security Threats": ["XSS", "CSRF", "SQL Injection", "Man-in-the-Middle"],
  "Cloud Providers": ["AWS", "GCP", "Azure", "DigitalOcean"],
  "Protocols": ["HTTP", "WebSocket", "gRPC", "MQTT"],
  "Version Control": ["Git", "SVN", "Mercurial", "Perforce"],
  "Software Testing Tools": ["Jest", "Cypress", "Selenium", "Playwright"],
};

export const MOCK_SESSION = {
  id: "mock-session-1",
  status: "active",
  start_time: new Date().toISOString(),
  category1: "Frontend Frameworks",
  category2: "Databases",
  category3: "CSS Units",
  category4: "Programming Languages",
  lab: 1,
};

export const MOCK_UPCOMING_SESSION = {
  id: "mock-session-upcoming",
  status: "scheduled",
  start_time: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  category1: "Browser Dev Tools",
  category2: "Web Security Threats",
  category3: "Cloud Providers",
  category4: "Protocols",
  lab: 1,
};

export const MOCK_TEAMS = [
  { id: "mock-t1", name: "Steam Coders", score: 3850, lab: 1, player_count: 3 },
  { id: "mock-t2", name: "Gear Hackers", score: 3200, lab: 1, player_count: 2 },
  { id: "mock-t3", name: "Volt Voyagers", score: 2950, lab: 2, player_count: 4 },
  { id: "mock-t4", name: "Clockwork Devs", score: 2400, lab: 1, player_count: 2 },
  { id: "mock-t5", name: "Brass Byte", score: 1980, lab: 2, player_count: 3 },
  { id: "mock-t6", name: "Iron Logic", score: 1500, lab: 2, player_count: 1 },
];

export const MOCK_SESSIONS = [
  {
    id: "mock-s1",
    status: "active",
    start_time: new Date().toISOString(),
    lab: 1,
    category1: "Frontend Frameworks",
    category2: "Databases",
    category3: "CSS Units",
    category4: "Programming Languages",
  },
  {
    id: "mock-s2",
    status: "scheduled",
    start_time: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    lab: 1,
    category1: "Browser Dev Tools",
    category2: "Web Security Threats",
    category3: "Cloud Providers",
    category4: "Protocols",
  },
  {
    id: "mock-s3",
    status: "completed",
    start_time: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    lab: 2,
    category1: "Version Control",
    category2: "Database Concepts",
    category3: "SDLC Methods",
    category4: "Software Testing Tools",
  },
];

export const MOCK_SUBMISSIONS = [
  { teamName: "Steam Coders", score: 950, timestamp: "Just now" },
  { teamName: "Gear Hackers", score: 870, timestamp: "2 mins ago" },
  { teamName: "Volt Voyagers", score: 720, timestamp: "5 mins ago" },
];
