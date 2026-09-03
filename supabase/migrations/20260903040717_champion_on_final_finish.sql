-- Al finalizar la FINAL se setean champion_team_id / runner_up_team_id del
-- torneo automáticamente; al reiniciar la final se limpian. Además
-- matches_set_winner recalcula el ganador ante CUALQUIER corrección de marcador
-- de un partido finalizado (antes solo lo hacía si winner_team_id era null:
-- corregir una final ya jugada no actualizaba el ganador ni el cuadro).

create or replace function public.matches_set_winner()
returns trigger
language plpgsql
set search_path to ''
as $function$
begin
  if new.status = 'FINALIZADO' and new.home_score <> new.away_score then
    new.winner_team_id := case when new.home_score > new.away_score
      then new.home_team_id else new.away_team_id end;
  end if;
  new.updated_at := now();
  return new;
end;
$function$;

create or replace function public.matches_after_finish()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if new.status = 'FINALIZADO' then
    if new.winner_team_id is not null then
      update public.matches set home_team_id = new.winner_team_id
        where home_source_match_id = new.id;
      update public.matches set away_team_id = new.winner_team_id
        where away_source_match_id = new.id;
    end if;

    if new.stage = 'GROUP' then
      perform public.recalculate_standings(new.tournament_id);
    end if;

    if new.stage = 'FINAL' and new.winner_team_id is not null then
      update public.tournaments set
        champion_team_id = new.winner_team_id,
        runner_up_team_id = case when new.winner_team_id = new.home_team_id
          then new.away_team_id else new.home_team_id end
      where id = new.tournament_id;
    end if;
  end if;
  return new;
end;
$function$;

create or replace function public.reset_match(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare v_tournament_id uuid;
declare v_stage public.match_stage;
begin
  if not private.is_admin() then
    raise exception 'No autorizado' using errcode = '42501';
  end if;

  select tournament_id, stage into v_tournament_id, v_stage
  from public.matches where id = p_match_id;
  if v_tournament_id is null then
    raise exception 'Partido % no existe', p_match_id;
  end if;

  delete from public.match_events where match_id = p_match_id;

  update public.matches set
    status = 'PROGRAMADO',
    current_period = 'PRE',
    home_score = 0,
    away_score = 0,
    started_at = null,
    paused_at = null,
    elapsed_seconds = 0,
    winner_team_id = null
  where id = p_match_id;

  update public.matches set home_team_id = null where home_source_match_id = p_match_id;
  update public.matches set away_team_id = null where away_source_match_id = p_match_id;

  if v_stage = 'GROUP' then
    perform public.recalculate_standings(v_tournament_id);
  end if;

  if v_stage = 'FINAL' then
    update public.tournaments set champion_team_id = null, runner_up_team_id = null
    where id = v_tournament_id;
  end if;
end;
$function$;

revoke execute on function public.reset_match(uuid) from anon;
grant execute on function public.reset_match(uuid) to authenticated;
