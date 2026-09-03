-- Helpers de prueba/demo para el admin (botón "Zona de pruebas" en /admin):
--  reset_tournament    -> deja el torneo en 0-0 / PROGRAMADO (el partido
--                         femenino y sus equipos quedan intactos), estado
--                         IN_PROGRESS, sin campeón, cuadro vacío.
--  simulate_tournament -> resetea y juega un torneo entero al azar: fase de
--                         grupos (0-4 por lado), sorteo de cuartos con bombos
--                         (evita mismo grupo), llaves sin empate (avanza por
--                         el trigger matches_after_finish), partido femenino,
--                         y cierra el torneo (status FINISHED; el campeón lo
--                         setea el trigger de la final).
-- Ambas chequean is_admin(). No tocan la config ni los horarios.

create or replace function public.reset_tournament(p_tournament_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $fn$
begin
  if not private.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  delete from public.match_events
  where match_id in (select id from public.matches where tournament_id = p_tournament_id);

  update public.matches set home_team_id = null, away_team_id = null
  where tournament_id = p_tournament_id and stage in ('QUARTERFINAL', 'SEMIFINAL', 'FINAL');

  update public.matches set
    status = 'PROGRAMADO', current_period = 'PRE',
    home_score = 0, away_score = 0,
    started_at = null, paused_at = null, elapsed_seconds = 0, winner_team_id = null
  where tournament_id = p_tournament_id;

  update public.tournaments set
    status = 'IN_PROGRESS', champion_team_id = null, runner_up_team_id = null
  where id = p_tournament_id;

  perform public.recalculate_standings(p_tournament_id);
end $fn$;

revoke execute on function public.reset_tournament(uuid) from anon, public;
grant execute on function public.reset_tournament(uuid) to authenticated;


create or replace function public.simulate_tournament(p_tournament_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $fn$
declare
  m record;
  a int; b int;
  v_winners uuid[]; v_runners uuid[]; v_thirds uuid[];
  v_pot1 uuid[]; v_pot2 uuid[]; v_grp1 uuid[]; v_grp2 uuid[]; v_qf uuid[];
  tmp uuid;
begin
  if not private.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  perform public.reset_tournament(p_tournament_id);

  -- 1) Fase de grupos: marcadores 0-4 al azar. Triggers recalculan la tabla.
  update public.matches set
    home_score = floor(random() * 5)::int,
    away_score = floor(random() * 5)::int,
    status = 'FINALIZADO', current_period = 'ENDED'
  where tournament_id = p_tournament_id and stage = 'GROUP' and category = 'MASCULINO';

  -- 2) Sorteo de cuartos (bombos, evita mismo grupo).
  select array_agg(s.team_id order by g.name) into v_winners
  from public.standings s join public.groups g on g.id = s.group_id
  where s.tournament_id = p_tournament_id and s.position = 1;
  select array_agg(s.team_id order by g.name) into v_runners
  from public.standings s join public.groups g on g.id = s.group_id
  where s.tournament_id = p_tournament_id and s.position = 2;
  select array_agg(s.team_id order by s.points desc, s.goal_diff desc, s.goals_for desc,
                   coalesce(t.manual_tiebreak, 0) desc)
    into v_thirds
  from public.standings s join public.teams t on t.id = s.team_id
  where s.tournament_id = p_tournament_id and s.position = 3;

  if coalesce(array_length(v_winners, 1), 0) = 3
     and coalesce(array_length(v_runners, 1), 0) = 3
     and coalesce(array_length(v_thirds, 1), 0) = 3 then

    select array_agg(x order by random()) into v_pot1 from unnest(v_winners || array[v_thirds[1]]) as x;
    select array_agg(x order by random()) into v_pot2 from unnest(v_runners || array[v_thirds[2]]) as x;
    select array_agg(tt.group_id order by u.idx) into v_grp1
    from unnest(v_pot1) with ordinality as u(id, idx) join public.teams tt on tt.id = u.id;
    select array_agg(tt.group_id order by u.idx) into v_grp2
    from unnest(v_pot2) with ordinality as u(id, idx) join public.teams tt on tt.id = u.id;

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
    from public.matches where tournament_id = p_tournament_id and stage = 'QUARTERFINAL';
    for i in 1..4 loop
      update public.matches set home_team_id = v_pot1[i], away_team_id = v_pot2[i]
      where id = v_qf[i];
    end loop;

    insert into public.roulette_draws (tournament_id, draw_type, eliminated_ids, created_by)
    values (p_tournament_id, 'QUARTERFINAL_DRAW', array[v_thirds[3]], auth.uid());
  end if;

  -- 3) Cuartos -> semis -> final: marcador al azar sin empate. El trigger
  --    matches_after_finish rellena la ronda siguiente entre lote y lote.
  for m in
    select id from public.matches
    where tournament_id = p_tournament_id and stage = 'QUARTERFINAL'
      and home_team_id is not null and away_team_id is not null
    order by bracket_slot
  loop
    a := 1 + floor(random() * 4)::int; b := 1 + floor(random() * 4)::int;
    if a = b then a := a + 1; end if;
    update public.matches set home_score = a, away_score = b,
           status = 'FINALIZADO', current_period = 'ENDED'
    where id = m.id;
  end loop;

  for m in
    select id from public.matches
    where tournament_id = p_tournament_id and stage = 'SEMIFINAL'
      and home_team_id is not null and away_team_id is not null
    order by bracket_slot
  loop
    a := 1 + floor(random() * 4)::int; b := 1 + floor(random() * 4)::int;
    if a = b then a := a + 1; end if;
    update public.matches set home_score = a, away_score = b,
           status = 'FINALIZADO', current_period = 'ENDED'
    where id = m.id;
  end loop;

  for m in
    select id from public.matches
    where tournament_id = p_tournament_id and stage = 'FINAL'
      and home_team_id is not null and away_team_id is not null
  loop
    a := 1 + floor(random() * 4)::int; b := 1 + floor(random() * 4)::int;
    if a = b then a := a + 1; end if;
    update public.matches set home_score = a, away_score = b,
           status = 'FINALIZADO', current_period = 'ENDED'
    where id = m.id;
  end loop;

  -- 4) Partido femenino
  update public.matches set
    home_score = floor(random() * 4)::int, away_score = floor(random() * 4)::int,
    status = 'FINALIZADO', current_period = 'ENDED'
  where tournament_id = p_tournament_id and category = 'FEMENINO';

  -- 5) Cerrar el torneo (el campeón lo setea el trigger de la final).
  update public.tournaments set status = 'FINISHED', ends_at = coalesce(ends_at, now())
  where id = p_tournament_id;
end $fn$;

revoke execute on function public.simulate_tournament(uuid) from anon, public;
grant execute on function public.simulate_tournament(uuid) to authenticated;
