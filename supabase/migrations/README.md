# supabase/migrations

Migraciones **incrementales** aplicadas al proyecto después de arrancar a
versionar (vía Supabase MCP / `apply_migration`).

⚠️ **Acá NO está el esquema base** (las 10 tablas del torneo, enums, funciones
de control, triggers, RLS y el seed inicial). Eso se aplicó directo al proyecto
`TU-PROYECTO` antes de empezar a versionar. Para levantar el proyecto
en otro Supabase desde cero hay que, además de estas migraciones:

- pedir el volcado completo del esquema, o
- `supabase db pull` contra el proyecto actual para regenerar el baseline.

| Archivo | Qué agrega |
| ------- | ---------- |
| `20260828190920_add_slot_minutes_to_tournament_settings.sql` | columna `slot_minutes` (gap del reprogramado automático) |
| `20260828192916_add_reset_match_function.sql` | función `reset_match(p_match_id)` |
| `20260828203813_add_keepalive.sql` | tabla `keepalive` + función `ping_keepalive()` |
| `20260828212500_tighten_reset_match_grants.sql` | quita `reset_match` del alcance de `anon` (revoke a PUBLIC + grant a `authenticated`) |
| `20260903040437_update_tournament_format_settings.sql` | nuevo formato: arranque 13:00, `slot_minutes`=12, `qualifiers_per_group`=2, `best_third_places`=2 |
| `20260903040447_add_exhibition_match_stage.sql` | valor `EXHIBITION` en el enum `match_stage` (partido femenino) |
| `20260903040455_add_match_and_team_category.sql` | enum `match_category` + columnas `matches.category` / `teams.category` (Masculino / Femenino) |
| `20260903040501_add_team_manual_tiebreak.sql` | columna `teams.manual_tiebreak` (desempate manual del admin) |
| `20260903040542_improve_recalculate_standings_tiebreakers.sql` | `recalculate_standings`: filtra categoría MASCULINO + desempate H2H + `manual_tiebreak` |
| `20260903040649_add_draw_quarterfinals.sql` | función `draw_quarterfinals(p_tournament_id)` (sorteo de cuartos con bombos) + `draw_type` `QUARTERFINAL_DRAW` |
| `20260903040717_champion_on_final_finish.sql` | `matches_after_finish` setea campeón/subcampeón al terminar la final; `reset_match` los limpia; `matches_set_winner` recalcula el ganador ante cualquier corrección de marcador |
| `20260903040818_seed_womens_match_and_reschedule.sql` | 2 equipos + 1 partido femenino de exhibición; reprograma los 17 partidos al cronograma del torneo; `tournaments.starts_at` |
| `20260903050810_add_simulation_helpers.sql` | `reset_tournament` (a 0-0) + `simulate_tournament` (juega un torneo al azar) — para el botón "Zona de pruebas" del admin |
