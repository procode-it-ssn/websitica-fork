-- Adds the `lab` column referenced throughout the app.
-- `teams.lab`         -> JoinGame, AdminDashboard, waiting, PlayerGame
-- `quiz_sessions.lab` -> AdminDashboard (create/filter), waiting, PlayerGame
--
-- Nullable on purpose: the root route `/` renders <JoinGame /> with no lab
-- prop, so lab = NULL is a legitimate "no lab assigned" state.

alter table public.teams
  add column if not exists lab smallint;

alter table public.quiz_sessions
  add column if not exists lab smallint;

-- Both columns are only ever used as filter predicates.
create index if not exists teams_lab_idx
  on public.teams (lab);

create index if not exists quiz_sessions_lab_idx
  on public.quiz_sessions (lab);
