-- Modelo equivalente ao que a POC guarda hoje no aparelho (src/lib/store.ts,
-- localStorage). Não está em uso: serve de ponto de partida pra quando o BetFood
-- virar produto com servidor e contas. Mantido em par com o store — se mudar lá,
-- mude aqui (o schema antigo ficou defasado por semanas e enganava quem lesse).

create table restaurants (
  id text primary key,
  name text not null,
  cuisine text not null,
  neighborhood text not null,
  description text not null,
  accent text not null,       -- cor de destaque (hex)
  photo text not null,        -- foto do prato-assinatura
  rating numeric(2, 1) not null
);

-- Tabela de prêmios de cada casa. O peso define a chance; a faixa "none" é o
-- "não foi dessa vez" e também tem peso — o sorteio é sempre daqui.
create table prizes (
  id uuid primary key default gen_random_uuid(),
  restaurant_id text not null references restaurants (id) on delete cascade,
  label text not null,
  weight int not null check (weight > 0),
  tier text not null check (tier in ('small', 'medium', 'big', 'none'))
);

-- Jogador. Na POC não existe: o aparelho É o jogador.
create table players (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  chips int not null default 50,          -- moeda do app; jogada custa 10
  xp int not null default 0,
  streak int not null default 0,          -- dias seguidos jogando
  last_play_day date,
  last_bonus_day date,                    -- bônus diário (+30)
  last_regen_at timestamptz not null default now()  -- recarga: +10 a cada 10min, teto 50
);

-- Código que o restaurante entrega na mesa; credita fichas ao ser resgatado.
create table table_codes (
  code text primary key,
  restaurant_id text not null references restaurants (id) on delete cascade,
  credits int not null default 3,         -- jogadas (× 10 fichas)
  created_at timestamptz not null default now(),
  used_at timestamptz,
  used_by uuid references players (id)
);

-- Prêmio ganho: o jogador mostra o código, a casa valida no caixa.
create table coupons (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players (id) on delete cascade,
  restaurant_id text not null references restaurants (id) on delete cascade,
  game_id text not null,                  -- roleta | raspadinha | quiz | memoria
  prize_label text not null,
  code text not null,
  won_at timestamptz not null default now(),
  expires_at timestamptz not null,        -- 24h após o ganho
  redeemed_at timestamptz,
  unique (restaurant_id, code)            -- o código só precisa ser único na casa
);

create index on coupons (restaurant_id, redeemed_at, expires_at);
create index on table_codes (restaurant_id, used_at);
