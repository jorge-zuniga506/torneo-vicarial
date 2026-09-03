-- Nuevo formato Torneo Fut 5: arranque 13:00, cada partido ocupa ~12 min,
-- clasifican 2 por grupo + 2 mejores terceros (8 de 9). La pausa 15:00-15:50
-- no cambia. Nada hardcodeado: todo vive en tournament_settings.
update public.tournament_settings s
set tournament_start_time = '13:00:00',
    tournament_end_time   = '18:00:00',
    break_start_time      = '15:00:00',
    break_end_time        = '15:50:00',
    slot_minutes          = 12,
    qualifiers_per_group  = 2,
    best_third_places     = 2,
    updated_at            = now()
from public.tournaments t
where s.tournament_id = t.id;
