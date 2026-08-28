-- Tabla y función de "latido" para evitar que Supabase pause el proyecto por
-- inactividad (plan free: se pausa tras ~7 días sin actividad). Un job externo
-- llama a public.ping_keepalive() cada pocos días -> escritura real en la base.

create table if not exists public.keepalive (
  id smallint primary key default 1,
  last_ping timestamptz not null default now(),
  pings bigint not null default 0,
  constraint keepalive_singleton check (id = 1)
);

alter table public.keepalive enable row level security;
-- Sin policies: nadie lee/escribe directo; todo pasa por la función de abajo.

insert into public.keepalive (id) values (1) on conflict (id) do nothing;

create or replace function public.ping_keepalive()
returns timestamptz
language sql
security definer
set search_path to ''
as $function$
  update public.keepalive
    set last_ping = now(), pings = pings + 1
    where id = 1
  returning last_ping;
$function$;

comment on function public.ping_keepalive() is
  'Latido para mantener activo el proyecto Supabase. Lo llama un cron externo (ver scripts/keep-alive.mjs).';

revoke execute on function public.ping_keepalive() from public;
grant execute on function public.ping_keepalive() to anon, authenticated;
