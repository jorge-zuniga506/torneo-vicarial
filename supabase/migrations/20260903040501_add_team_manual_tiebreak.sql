-- Desempate manual del admin. Va en teams (no en standings) porque
-- recalculate_standings borra y reconstruye standings en cada recálculo.
-- Mayor valor = mejor posición entre equipos igualados tras PTS/DG/GF/H2H.
alter table public.teams
  add column if not exists manual_tiebreak integer not null default 0;

comment on column public.teams.manual_tiebreak is
  'Desempate manual del admin: mayor = mejor posición entre equipos igualados tras PTS, DG, GF y resultado entre ellos (H2H).';
