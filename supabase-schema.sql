-- ============================================================
-- SHD Multiservices — Base de données "Suivi des passages"
-- À coller dans Supabase → SQL Editor → New query → Run
-- ============================================================

-- 1) Table des copropriétés
create table if not exists copros (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  adresse text,
  frequence int default 0,          -- jours attendus entre deux passages (0 = pas de suivi)
  created_at timestamptz default now()
);

-- 2) Table des passages
create table if not exists passages (
  id uuid primary key default gen_random_uuid(),
  copro_id uuid references copros(id) on delete cascade,
  date timestamptz not null default now(),
  agent text not null,
  zones jsonb default '[]'::jsonb,
  observations text,
  photos jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 3) Sécurité (Row Level Security)
alter table copros enable row level security;
alter table passages enable row level security;

-- Lecture publique : les clients consultent l'historique sans compte.
create policy "lecture publique copros"   on copros   for select using (true);
create policy "lecture publique passages" on passages for select using (true);

-- Écriture publique (version simple). L'accès agent/gérant est protégé
-- côté appli par les codes. ⚠️ Pour une vraie sécurité, voir le guide.
create policy "ecriture copros"   on copros   for insert with check (true);
create policy "maj copros"        on copros   for update using (true);
create policy "suppr copros"      on copros   for delete using (true);
create policy "ecriture passages" on passages for insert with check (true);
create policy "suppr passages"    on passages for delete using (true);
