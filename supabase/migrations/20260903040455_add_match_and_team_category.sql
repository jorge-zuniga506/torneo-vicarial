-- Categoría Masculino / Femenino. El torneo masculino es la competición
-- (grupos + cuadro); el partido femenino es independiente y NO afecta tablas,
-- clasificación, cuadro ni estadísticas masculinas.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'match_category') then
    create type public.match_category as enum ('MASCULINO', 'FEMENINO');
  end if;
end $$;

alter table public.matches
  add column if not exists category public.match_category not null default 'MASCULINO';

alter table public.teams
  add column if not exists category public.match_category not null default 'MASCULINO';

comment on column public.matches.category is
  'MASCULINO = competición (grupos + cuadro). FEMENINO = partido de exhibición, no cuenta para tablas ni cuadro masculino.';
comment on column public.teams.category is
  'Categoría del equipo. Los equipos FEMENINO no entran en grupos, standings ni cuadro.';
