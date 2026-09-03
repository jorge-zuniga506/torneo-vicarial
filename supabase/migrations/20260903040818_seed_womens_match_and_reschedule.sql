-- Partido femenino de exhibición + cronograma del brief (hora local Costa Rica,
-- UTC-6 sin horario de verano). Fecha 2026-08-28 (la que ya traían los partidos).
-- Grupos: rotación A/B/C por jornada 13:00..14:36; femenino 14:48; pausa
-- 15:00-15:50; cuartos 15:50..16:26; semis 16:45/16:57; final 17:20.

-- 1. Dos equipos femeninos (categoría FEMENINO, sin grupo). Renombrables por el admin.
insert into public.teams (tournament_id, name, short_name, color, category, group_id)
select t.id, x.name, x.short_name, x.color, 'FEMENINO'::public.match_category, null
from public.tournaments t
cross join (values
  ('Femenino A', 'FEM A', '#5a1f4d'),
  ('Femenino B', 'FEM B', '#99122f')
) as x(name, short_name, color)
where not exists (
  select 1 from public.teams e where e.tournament_id = t.id and e.category = 'FEMENINO'
);

-- 2. El partido femenino (una sola exhibición).
insert into public.matches (tournament_id, stage, category, group_id, venue, scheduled_at, status)
select t.id, 'EXHIBITION'::public.match_stage, 'FEMENINO'::public.match_category, null,
       'Cancha principal', '2026-08-28 14:48:00-06'::timestamptz, 'PROGRAMADO'::public.match_status
from public.tournaments t
where not exists (
  select 1 from public.matches m where m.tournament_id = t.id and m.category = 'FEMENINO'
);

update public.matches m
set home_team_id = (select id from public.teams
                    where tournament_id = m.tournament_id and category = 'FEMENINO' and short_name = 'FEM A'),
    away_team_id = (select id from public.teams
                    where tournament_id = m.tournament_id and category = 'FEMENINO' and short_name = 'FEM B'),
    scheduled_at = '2026-08-28 14:48:00-06'::timestamptz
where m.category = 'FEMENINO';

-- 3. Reprogramar fase de grupos (rotación A/B/C por jornada) y fijar matchday.
update public.matches m
set scheduled_at = v.at, matchday = v.md
from public.groups g,
     (values
       ('A', 1, timestamptz '2026-08-28 13:00:00-06'),
       ('B', 1, timestamptz '2026-08-28 13:12:00-06'),
       ('C', 1, timestamptz '2026-08-28 13:24:00-06'),
       ('A', 2, timestamptz '2026-08-28 13:36:00-06'),
       ('B', 2, timestamptz '2026-08-28 13:48:00-06'),
       ('C', 2, timestamptz '2026-08-28 14:00:00-06'),
       ('A', 3, timestamptz '2026-08-28 14:12:00-06'),
       ('B', 3, timestamptz '2026-08-28 14:24:00-06'),
       ('C', 3, timestamptz '2026-08-28 14:36:00-06')
     ) as v(grp, md, at)
where m.group_id = g.id
  and m.stage = 'GROUP'
  and g.name = v.grp
  and coalesce(m.matchday, 1) = v.md;

-- 4. Reprogramar el cuadro. Huecos de preparación de 7 min antes de semis
-- (16:38-16:45) y antes de la final (17:09-17:20).
update public.matches m
set scheduled_at = v.at
from (values
  ('QF1',   timestamptz '2026-08-28 15:50:00-06'),
  ('QF2',   timestamptz '2026-08-28 16:02:00-06'),
  ('QF3',   timestamptz '2026-08-28 16:14:00-06'),
  ('QF4',   timestamptz '2026-08-28 16:26:00-06'),
  ('SF1',   timestamptz '2026-08-28 16:45:00-06'),
  ('SF2',   timestamptz '2026-08-28 16:57:00-06'),
  ('FINAL', timestamptz '2026-08-28 17:20:00-06')
) as v(slot, at)
where m.bracket_slot = v.slot;

-- 5. starts_at del torneo (mejora anchorDate del reprogramador y el hero).
update public.tournaments t
set starts_at = timestamptz '2026-08-28 13:00:00-06'
from public.tournament_settings s
where s.tournament_id = t.id;
