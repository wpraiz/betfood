-- Schema futuro (pós-POC). Hoje o app usa localStorage (src/lib/store.ts);
-- este arquivo espelha o modelo pra migração ser 1:1.

create table restaurants (
  id text primary key,
  name text not null,
  emoji text not null,
  cuisine text not null,
  neighborhood text not null,
  description text not null,
  accent text not null
);

create table prizes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null references restaurants (id),
  label text not null,
  weight int not null,
  tier text not null check (tier in ('small', 'medium', 'big', 'none'))
);

create table table_codes (
  code text primary key,
  restaurant_id text not null references restaurants (id),
  credits int not null default 3,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create table coupons (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null references restaurants (id),
  game_id text not null,
  prize_label text not null,
  code text not null,
  won_at timestamptz not null default now(),
  redeemed_at timestamptz,
  -- pós-POC: amarrar ao usuário autenticado (Supabase Auth)
  user_id uuid
);
