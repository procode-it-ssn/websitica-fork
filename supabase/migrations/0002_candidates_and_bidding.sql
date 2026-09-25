-- Migration: 0002_candidates_and_bidding.sql
-- Creates candidates directory, passkeys, individual scores, and multi-round marking

-- 1. Candidates table for pre-registered candidates (imported from Excel or added by admin)
create table if not exists public.candidates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text,
  phone text,
  college text,
  year_of_study integer,
  gender text,
  ticket_id text,
  ticket_type text,
  payment_status text,
  team_id bigint,
  team_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists candidates_name_idx on public.candidates (name);
create index if not exists candidates_team_id_idx on public.candidates (team_id);
create index if not exists candidates_email_idx on public.candidates (email);

-- Enable RLS and public policies
alter table public.candidates enable row level security;

drop policy if exists "Allow public read access to candidates" on public.candidates;
create policy "Allow public read access to candidates"
  on public.candidates for select
  using (true);

drop policy if exists "Allow public insert/update to candidates" on public.candidates;
create policy "Allow public insert/update to candidates"
  on public.candidates for all
  using (true)
  with check (true);

-- 2. Enhance teams table with participant details, passkey & multi-round scores
alter table public.teams
  add column if not exists passkey text,
  add column if not exists participant1_name text,
  add column if not exists participant2_name text,
  add column if not exists participant1_score integer default 0,
  add column if not exists participant2_score integer default 0,
  add column if not exists codections_score integer default 0,
  add column if not exists r1_web_ui integer default 0,
  add column if not exists r1_web_ux integer default 0,
  add column if not exists r1_web_tech integer default 0,
  add column if not exists r1_web_total integer default 0,
  add column if not exists bidding_score integer default 0,
  add column if not exists r1_total_score integer default 0,
  add column if not exists is_r2_qualified boolean default false,
  add column if not exists r2_accuracy integer default 0,
  add column if not exists r2_responsiveness integer default 0,
  add column if not exists r2_code_quality integer default 0,
  add column if not exists r2_communication integer default 0,
  add column if not exists r2_aura_points integer default 100,
  add column if not exists r2_total_score integer default 0,
  add column if not exists grand_total_score integer default 0,
  add column if not exists total_score integer default 0;

-- 3. Bidding scoring logs for interactive question-by-question tracking
create table if not exists public.bidding_history (
  id uuid default gen_random_uuid() primary key,
  team_id bigint,
  question_number integer default 1,
  points_delta integer not null,
  score_after integer not null,
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists bidding_history_team_id_idx on public.bidding_history (team_id);

alter table public.bidding_history enable row level security;

drop policy if exists "Allow public read access to bidding_history" on public.bidding_history;
create policy "Allow public read access to bidding_history"
  on public.bidding_history for select
  using (true);

drop policy if exists "Allow public insert/update to bidding_history" on public.bidding_history;
create policy "Allow public insert/update to bidding_history"
  on public.bidding_history for all
  using (true)
  with check (true);

