-- recalculate_standings ahora:
--  * ignora la categoría FEMENINO (defensa en profundidad; t.group_id is not
--    null ya la excluía),
--  * ordena la posición con desempates encadenados:
--    PTS -> DG -> GF -> resultado entre los empatados (H2H) -> desempate manual
--    (teams.manual_tiebreak) -> nombre.
--    En grupos de 3 un triple empate no se rompe por H2H y cae al desempate
--    manual: es el comportamiento correcto.
create or replace function public.recalculate_standings(p_tournament_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
begin
  delete from public.standings where tournament_id = p_tournament_id;

  insert into public.standings (
    tournament_id, group_id, team_id, played, won, drawn, lost,
    goals_for, goals_against, goal_diff, points
  )
  select
    p_tournament_id,
    t.group_id,
    t.id,
    count(m.id),
    count(*) filter (where
      (m.home_team_id = t.id and m.home_score > m.away_score) or
      (m.away_team_id = t.id and m.away_score > m.home_score)),
    count(*) filter (where m.id is not null and m.home_score = m.away_score),
    count(*) filter (where
      (m.home_team_id = t.id and m.home_score < m.away_score) or
      (m.away_team_id = t.id and m.away_score < m.home_score)),
    coalesce(sum(case when m.home_team_id = t.id then m.home_score else m.away_score end), 0),
    coalesce(sum(case when m.home_team_id = t.id then m.away_score else m.home_score end), 0),
    coalesce(sum(case when m.home_team_id = t.id then m.home_score else m.away_score end), 0)
      - coalesce(sum(case when m.home_team_id = t.id then m.away_score else m.home_score end), 0),
    coalesce(sum(case
      when m.home_team_id = t.id and m.home_score > m.away_score then 3
      when m.away_team_id = t.id and m.away_score > m.home_score then 3
      when m.home_score = m.away_score then 1
      else 0
    end), 0)
  from public.teams t
  left join public.matches m
    on m.status = 'FINALIZADO'
    and m.stage = 'GROUP'
    and m.category = 'MASCULINO'
    and m.tournament_id = p_tournament_id
    and (m.home_team_id = t.id or m.away_team_id = t.id)
  where t.tournament_id = p_tournament_id
    and t.group_id is not null
    and t.category = 'MASCULINO'
  group by t.group_id, t.id;

  with base as (
    select s.id, s.team_id, s.group_id, s.points, s.goal_diff, s.goals_for,
           t.name as team_name, coalesce(t.manual_tiebreak, 0) as manual_tiebreak
    from public.standings s
    join public.teams t on t.id = s.team_id
    where s.tournament_id = p_tournament_id
  ),
  peers as (
    select b1.id, array_agg(b2.team_id) as team_ids
    from base b1
    join base b2
      on b2.group_id = b1.group_id
     and b2.points = b1.points
     and b2.goal_diff = b1.goal_diff
     and b2.goals_for = b1.goals_for
    group by b1.id
  ),
  h2h as (
    select p.id,
      coalesce(sum(case
        when m.home_team_id = b.team_id and m.home_score > m.away_score then 3
        when m.away_team_id = b.team_id and m.away_score > m.home_score then 3
        when m.home_score = m.away_score then 1
        else 0
      end), 0) as h2h_points
    from peers p
    join base b on b.id = p.id
    left join public.matches m
      on m.tournament_id = p_tournament_id
     and m.stage = 'GROUP'
     and m.category = 'MASCULINO'
     and m.status = 'FINALIZADO'
     and array_length(p.team_ids, 1) > 1
     and m.home_team_id = any(p.team_ids)
     and m.away_team_id = any(p.team_ids)
     and (m.home_team_id = b.team_id or m.away_team_id = b.team_id)
    group by p.id
  ),
  ranked as (
    select b.id,
      row_number() over (
        partition by b.group_id
        order by b.points desc, b.goal_diff desc, b.goals_for desc,
                 coalesce(h.h2h_points, 0) desc, b.manual_tiebreak desc, b.team_name asc
      ) as rn
    from base b
    left join h2h h on h.id = b.id
  )
  update public.standings s
  set position = ranked.rn
  from ranked
  where s.id = ranked.id;
end;
$function$;

grant execute on function public.recalculate_standings(uuid) to authenticated;
