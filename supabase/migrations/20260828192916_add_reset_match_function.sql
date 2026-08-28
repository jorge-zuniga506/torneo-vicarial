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

  -- Si de este partido salía un equipo hacia una llave posterior, se limpia.
  update public.matches set home_team_id = null where home_source_match_id = p_match_id;
  update public.matches set away_team_id = null where away_source_match_id = p_match_id;

  -- La tabla puede haber contado este partido: se recalcula desde cero.
  if v_stage = 'GROUP' then
    perform public.recalculate_standings(v_tournament_id);
  end if;
end;
$function$;

revoke execute on function public.reset_match(uuid) from anon;
