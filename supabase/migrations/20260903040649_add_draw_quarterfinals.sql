-- "Sortear cuartos": con los 9 partidos de grupos jugados, arma QF1..QF4 con
-- los 8 clasificados (3 primeros + 3 segundos + 2 mejores terceros). Sorteo con
-- bombos evitando cruces del mismo grupo. El admin puede editar cada llave a
-- mano después. Semis/final quedan cableadas por *_source_match_id (trigger
-- matches_after_finish las rellena solas).

alter table public.roulette_draws drop constraint if exists roulette_draws_draw_type_check;
alter table public.roulette_draws add constraint roulette_draws_draw_type_check
  check (draw_type = any (array['TEAM_GROUP_ASSIGNMENT'::text, 'RANDOM_SELECTION'::text, 'QUARTERFINAL_DRAW'::text]));

create or replace function public.draw_quarterfinals(p_tournament_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_total int;
  v_done  int;
  v_winners uuid[];
  v_runners uuid[];
  v_thirds  uuid[];
  v_pot1 uuid[];
  v_pot2 uuid[];
  v_grp1 uuid[];
  v_grp2 uuid[];
  v_qf   uuid[];
  v_eliminated uuid;
  tmp uuid;
begin
  if not private.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  select count(*) filter (where status = 'FINALIZADO'), count(*)
    into v_done, v_total
  from public.matches
  where tournament_id = p_tournament_id and stage = 'GROUP' and category = 'MASCULINO';

  if coalesce(v_total, 0) = 0 then
    raise exception 'No hay partidos de fase de grupos en este torneo.';
  end if;
  if v_done < v_total then
    raise exception 'Faltan partidos de grupos por finalizar (% de % jugados).', v_done, v_total;
  end if;

  if exists (
    select 1 from public.matches
    where tournament_id = p_tournament_id and stage = 'QUARTERFINAL' and status <> 'PROGRAMADO'
  ) then
    raise exception 'Los cuartos ya empezaron. Reiniciá esos partidos antes de volver a sortear.';
  end if;

  select array_agg(s.team_id order by g.name)
    into v_winners
  from public.standings s join public.groups g on g.id = s.group_id
  where s.tournament_id = p_tournament_id and s.position = 1;

  select array_agg(s.team_id order by g.name)
    into v_runners
  from public.standings s join public.groups g on g.id = s.group_id
  where s.tournament_id = p_tournament_id and s.position = 2;

  -- Terceros del mejor al peor: PTS, DG, GF, desempate manual.
  select array_agg(s.team_id order by s.points desc, s.goal_diff desc, s.goals_for desc,
                   coalesce(t.manual_tiebreak, 0) desc)
    into v_thirds
  from public.standings s join public.teams t on t.id = s.team_id
  where s.tournament_id = p_tournament_id and s.position = 3;

  if coalesce(array_length(v_winners, 1), 0) <> 3
     or coalesce(array_length(v_runners, 1), 0) <> 3
     or coalesce(array_length(v_thirds, 1), 0) <> 3 then
    raise exception 'La tabla no tiene 3 primeros, 3 segundos y 3 terceros definidos. Recalculá la clasificación.';
  end if;

  v_eliminated := v_thirds[3];

  -- Bombo 1: 3 primeros + mejor tercero. Bombo 2: 3 segundos + 2º mejor tercero.
  select array_agg(x order by random()) into v_pot1
  from unnest(v_winners || array[v_thirds[1]]) as x;
  select array_agg(x order by random()) into v_pot2
  from unnest(v_runners || array[v_thirds[2]]) as x;

  select array_agg(tt.group_id order by u.idx) into v_grp1
  from unnest(v_pot1) with ordinality as u(id, idx)
  join public.teams tt on tt.id = u.id;
  select array_agg(tt.group_id order by u.idx) into v_grp2
  from unnest(v_pot2) with ordinality as u(id, idx)
  join public.teams tt on tt.id = u.id;

  -- Dos pasadas: si pot1[i] y pot2[i] son del mismo grupo, intercambiar pot2[i]
  -- con un pot2[j] posterior de otro grupo (best effort).
  for pass in 1..2 loop
    for i in 1..4 loop
      if v_grp1[i] = v_grp2[i] then
        for j in 1..4 loop
          if j <> i and v_grp2[j] <> v_grp1[i] and v_grp2[j] <> v_grp1[j] then
            tmp := v_pot2[i]; v_pot2[i] := v_pot2[j]; v_pot2[j] := tmp;
            tmp := v_grp2[i]; v_grp2[i] := v_grp2[j]; v_grp2[j] := tmp;
            exit;
          end if;
        end loop;
      end if;
    end loop;
  end loop;

  select array_agg(id order by bracket_slot) into v_qf
  from public.matches
  where tournament_id = p_tournament_id and stage = 'QUARTERFINAL';

  for i in 1..4 loop
    update public.matches set
      home_team_id = v_pot1[i],
      away_team_id = v_pot2[i],
      home_source_match_id = null,
      away_source_match_id = null,
      status = 'PROGRAMADO',
      current_period = 'PRE',
      home_score = 0,
      away_score = 0,
      started_at = null,
      paused_at = null,
      elapsed_seconds = 0,
      winner_team_id = null
    where id = v_qf[i];
  end loop;

  update public.matches set
    home_team_id = null, away_team_id = null, winner_team_id = null,
    status = 'PROGRAMADO', current_period = 'PRE',
    home_score = 0, away_score = 0,
    started_at = null, paused_at = null, elapsed_seconds = 0
  where tournament_id = p_tournament_id and stage in ('SEMIFINAL', 'FINAL');

  insert into public.roulette_draws (tournament_id, draw_type, eliminated_ids, created_by)
  values (p_tournament_id, 'QUARTERFINAL_DRAW', array[v_eliminated], auth.uid());
end;
$function$;

revoke execute on function public.draw_quarterfinals(uuid) from anon, public;
grant execute on function public.draw_quarterfinals(uuid) to authenticated;
