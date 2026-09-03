# Base de datos — Torneo Vicarial

Proyecto Supabase `TU-PROYECTO`. PostgreSQL + Realtime + Auth.

La fuente de verdad de las columnas exactas es
`frontend/src/types/database.ts` (tipos generados). Este documento explica el
**modelo** y **la lógica**.

---

## Principio de diseño

Toda la lógica de negocio vive en **Postgres** (funciones + triggers). El
frontend sólo llama funciones (`supabase.rpc(...)`) o hace `select`/`insert`
simples que RLS deja pasar. Nunca recalcula marcadores ni tablas por su
cuenta. Ventaja: no se puede desincronizar, y la seguridad es del servidor.

---

## Enums

| Enum             | Valores                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `user_role`      | `ADMIN`, `VIEWER`                                                                           |
| `match_stage`    | `GROUP`, `QUARTERFINAL`, `SEMIFINAL`, `FINAL`, `THIRD_PLACE`, `EXHIBITION`                  |
| `match_category` | `MASCULINO`, `FEMENINO`                                                                     |
| `match_status`   | `PROGRAMADO`, `CALENTAMIENTO`, `EN_JUEGO`, `DESCANSO`, `FINALIZADO`, `SUSPENDIDO`, `CANCELADO` |
| `match_period`   | `PRE`, `FIRST_HALF`, `HALFTIME`, `SECOND_HALF`, `ENDED`                                     |
| `event_type`     | `GOAL`, `YELLOW_CARD`, `RED_CARD`, `SUBSTITUTION`, `START`, `HALFTIME`, `RESUME`, `END`     |

---

## Tablas

Todas tienen `id uuid default gen_random_uuid()` (salvo donde se indica),
`created_at` / `updated_at` según el caso, y **RLS activado**.

### `profiles`
Perfil + rol de cada usuario de Supabase Auth.
`id` (= `auth.users.id`), `full_name`, `role user_role default 'VIEWER'`.
Un trigger `on_auth_user_created` (función `handle_new_user`) inserta la fila
al registrarse.

### `tournaments`
`name`, `slug` (único), `status` (`SETUP` / `IN_PROGRESS` / `PAUSED` /
`FINISHED`), `starts_at`, `ends_at`, `champion_team_id`, `runner_up_team_id`.

### `tournament_settings`
Config del torneo — **nada hardcodeado en el código**. PK = `tournament_id`.
`team_count` (9), `group_count` (3), `teams_per_group` (3),
`matches_per_team_group_stage` (2), `qualifiers_per_group` (2),
`best_third_places` (2), `elimination_format` (`QUARTERFINAL` / `SEMIFINAL` /
`FINAL_ONLY`), `first_half_minutes` (5), `halftime_minutes` (1),
`second_half_minutes` (5), `slot_minutes` (12 — minutos entre partidos en el
reprogramado automático), `tournament_start_time` (13:00),
`tournament_end_time` (18:00), `break_start_time` (15:00),
`break_end_time` (15:50), `tiebreaker_order jsonb`
(`["POINTS","GOAL_DIFF","GOALS_FOR","HEAD_TO_HEAD","FAIR_PLAY","RANDOM"]`).

Formato actual: 9 equipos masculinos, 3 grupos de 3, todos contra todos (2
partidos por equipo). Clasifican **8 de 9**: 2 por grupo + 2 mejores terceros;
el peor tercero queda eliminado. Además 1 **partido femenino** de exhibición
(`stage='EXHIBITION'`, `category='FEMENINO'`) que no cuenta para tablas, cuadro
ni estadísticas masculinas.

### `groups`
`tournament_id`, `name` ("A" / "B" / "C"), `display_order`.

### `teams`
`tournament_id`, `group_id` (nullable), `name`, `short_name`, `logo_url`,
`color`, `captain_player_id`, `fair_play_points numeric`,
`category match_category default 'MASCULINO'` (los `FEMENINO` no entran en
grupos, standings ni cuadro),
`manual_tiebreak int default 0` (desempate manual del admin: mayor = mejor
posición entre equipos igualados tras PTS/DG/GF/H2H; vive en `teams` porque
`recalculate_standings` reconstruye `standings` desde cero).

### `players`
`team_id`, `name`, `jersey_number`, `position`, `photo_url`.

### `matches`
`tournament_id`, `stage match_stage`, `category match_category default
'MASCULINO'` (el partido femenino es `EXHIBITION` + `FEMENINO`), `group_id`
(nullable), `bracket_slot` (`"QF1"`, `"SF1"`, `"FINAL"`, …), `matchday`,
`home_team_id` / `away_team_id` (nullable),
`home_source_match_id` / `away_source_match_id` (de qué partido sale el equipo,
para el cuadro), `venue` (default `'Cancha principal'`),
`scheduled_at`, `status match_status default 'PROGRAMADO'`,
`current_period match_period default 'PRE'`,
`home_score` / `away_score` (default 0),
`started_at`, `elapsed_seconds` (default 0), `paused_at`,
`winner_team_id`.

### `match_events`
`match_id`, `team_id` (nullable), `player_id` (nullable),
`assist_player_id` (nullable), `event_type`, `minute`, `period`, `occurred_at`.

### `standings`
**Tabla derivada** — la reescribe `recalculate_standings`, nunca el cliente.
`tournament_id`, `group_id`, `team_id`, `played`, `won`, `drawn`, `lost`,
`goals_for`, `goals_against`, `goal_diff`, `points`, `position`.

### `roulette_draws`
Registro de cada giro de la ruleta.
`tournament_id`, `draw_type` (`TEAM_GROUP_ASSIGNMENT` / `RANDOM_SELECTION`),
`group_id`, `result_team_id`, `result_player_id`, `eliminated_ids uuid[]`,
`created_by` (= `auth.users.id`).

### `keepalive`
Latido anti-pausa. Fila única (`id smallint default 1`, check `id = 1`),
`last_ping timestamptz`, `pings bigint`. RLS activado **sin policies** — sólo
se toca vía `ping_keepalive()`.

---

## Vistas

### `player_stats`
Agrega `match_events` por jugador.
`player_id`, `team_id`, `goals`, `assists`, `yellow_cards`, `red_cards`.
La usan los goleadores del sitio y las stats por jugador del admin.

---

## Funciones (RPC)

Todas las de control de partido son `SECURITY DEFINER` y **chequean
`private.is_admin()` internamente** (lanzan `42501 No autorizado` si no).

| Función | Args | Qué hace |
| ------- | ---- | -------- |
| `record_goal` | `p_match_id, p_team_id, p_player_id, p_assist_player_id?, p_minute?` | +1 al marcador del equipo + inserta evento `GOAL`. `p_player_id` puede ser `null` (gol sin autor). |
| `record_card` | `p_match_id, p_team_id, p_player_id, p_card_type, p_minute?` | inserta evento `YELLOW_CARD` / `RED_CARD`. |
| `undo_goal` | `p_match_id, p_team_id, p_event_id` | borra ese evento `GOAL` y resta 1 al marcador (mínimo 0). |
| `set_match_score` | `p_match_id, p_home_score, p_away_score` | fija el marcador sin eventos (corrección manual). |
| `start_match` | `p_match_id` | `EN_JUEGO` / `FIRST_HALF`, `started_at = now()`, `elapsed_seconds = 0`. Evento `START`. |
| `pause_match` | `p_match_id` | acumula en `elapsed_seconds`, `started_at = null`, `paused_at = now()`. |
| `resume_match` | `p_match_id` | `started_at = now()`, `paused_at = null`. |
| `start_halftime` | `p_match_id` | `DESCANSO` / `HALFTIME`, cronómetro a 0. Evento `HALFTIME`. |
| `start_second_half` | `p_match_id` | `EN_JUEGO` / `SECOND_HALF`, `started_at = now()`, a 0. Evento `RESUME`. |
| `finish_match` | `p_match_id` | `FINALIZADO` / `ENDED`. Evento `END`. Dispara los triggers de abajo. |
| `reset_match` | `p_match_id` | vuelve a `PROGRAMADO` / `PRE`, 0-0, borra eventos y cronómetro, limpia el equipo en llaves que salían de este partido, `recalculate_standings` si es de grupos, y **si es la FINAL limpia `champion_team_id` / `runner_up_team_id`**. |
| `recalculate_standings` | `p_tournament_id` | **borra y reconstruye** todas las filas de `standings` del torneo desde los partidos `FINALIZADO` de grupos **masculinos**. Orden por `points`, `goal_diff`, `goals_for`, **resultado entre los empatados (H2H)**, **`teams.manual_tiebreak`**, nombre. En grupos de 3 un triple empate no se rompe por H2H y cae al desempate manual. `EXECUTE` para `authenticated` (lo usa `/admin/standings`). |
| `draw_quarterfinals` | `p_tournament_id` | con los 9 partidos de grupos `FINALIZADO`, arma QF1–QF4 con los 8 clasificados (3 primeros + 3 segundos + 2 mejores terceros; peor tercero eliminado). Sorteo con bombos (primeros+mejor 3.º vs segundos+2.º mejor 3.º) evitando cruces del mismo grupo. Escribe los equipos en los 4 `QUARTERFINAL`, resetea semis/final (se rellenan por trigger) y registra un `roulette_draws` `QUARTERFINAL_DRAW`. Chequea `is_admin()`; falla si los cuartos ya empezaron. |
| `reset_tournament` | `p_tournament_id` | deja todos los partidos en 0-0 / `PROGRAMADO`, borra eventos, vacía equipos de QF/SF/FINAL, limpia campeón/subcampeón, `status = 'IN_PROGRESS'` y `recalculate_standings`. El partido femenino y sus equipos quedan intactos. Chequea `is_admin()`. (Botón "Zona de pruebas" en `/admin`.) |
| `simulate_tournament` | `p_tournament_id` | `reset_tournament` + juega un torneo entero al azar: grupos (0-4 por lado), sorteo de cuartos (bombos), llaves sin empate (avance por trigger), partido femenino, y `status = 'FINISHED'` (el campeón lo setea el trigger de la final). Chequea `is_admin()`. Para demos / ver cómo queda todo. |
| `ping_keepalive` | — | `UPDATE keepalive` (latido). `EXECUTE` para `anon` / `authenticated`. |

---

## Triggers

Sobre `matches`:

| Trigger | Cuándo | Función | Efecto |
| ------- | ------ | ------- | ------ |
| `matches_before_update` | `BEFORE UPDATE` | `matches_set_winner` | si está `FINALIZADO` y hay diferencia de gol, (re)calcula `winner_team_id` — en **cada** update, así corregir el marcador de un partido ya finalizado actualiza el ganador. Siempre `updated_at = now()`. |
| `matches_after_update`  | `AFTER UPDATE`  | `matches_after_finish` | si quedó `FINALIZADO`: propaga el ganador a los partidos cuyo `home/away_source_match_id` es este (avance del cuadro); si es de grupos, `recalculate_standings`; **si es la FINAL, setea `tournaments.champion_team_id` / `runner_up_team_id`**. |

Sobre `auth.users`: `handle_new_user` crea el `profiles` al registrarse.

> Nota: un empate en una llave (`home_score = away_score` en `FINALIZADO`) deja
> `winner_team_id` como estaba — no hay resolución por penales en el modelo; el
> admin corrige el marcador para definir un ganador.

---

## Row Level Security

Patrón uniforme:

- **SELECT**: `to anon, authenticated using (true)` — lectura pública en
  `tournaments`, `tournament_settings`, `groups`, `teams`, `players`,
  `matches`, `match_events`, `standings`.
- **INSERT / UPDATE / DELETE**: `to authenticated` con
  `using ( (select private.is_admin()) )` — sólo admin.
  `private.is_admin()` lee `public.profiles.role` del usuario del JWT.
- `standings`: **sólo SELECT**. No hay policy de escritura → nadie la edita
  desde el cliente; la mantiene `recalculate_standings` (que es DEFINER).
- `roulette_draws`: policy `ALL` para admin, sin lectura pública.
- `profiles`: cada uno ve su fila; admin ve todas.
- `keepalive`: RLS activado, **sin policies**. Sólo `ping_keepalive()`.

Los advisors de seguridad marcan las funciones `SECURITY DEFINER` ejecutables
por `authenticated` (`record_goal`, `start_match`, `ping_keepalive`, …) como
`WARN`. Es **intencional**: cada una controla el permiso adentro.

---

## Realtime

Publicación `supabase_realtime` incluye: **`matches`, `match_events`,
`teams`, `players`, `standings`**.

Los hooks del frontend se suscriben a `postgres_changes` (`event: '*'`) de su
tabla y recargan ante cualquier cambio. `groups` y `tournament_settings` no
están en la publicación (casi nunca cambian) — se leen una vez.

---

## Migraciones aplicadas

| Versión | Nombre |
| ------- | ------ |
| `20260828190920` | `add_slot_minutes_to_tournament_settings` |
| `20260828192916` | `add_reset_match_function` |
| `20260828203813` | `add_keepalive` (tabla `keepalive` + `ping_keepalive()`) |
| `20260828212443` | `tighten_reset_match_grants` |
| `20260903040437` | `update_tournament_format_settings` (13:00 / slot 12 / 2 + 2) |
| `20260903040447` | `add_exhibition_match_stage` |
| `20260903040455` | `add_match_and_team_category` |
| `20260903040501` | `add_team_manual_tiebreak` |
| `20260903040542` | `improve_recalculate_standings_tiebreakers` |
| `20260903040649` | `add_draw_quarterfinals` |
| `20260903040717` | `champion_on_final_finish` |
| `20260903040818` | `seed_womens_match_and_reschedule` |
| `20260903050810` | `add_simulation_helpers` |

El esquema base (10 tablas + enums + funciones + triggers + RLS + seed) se
aplicó al proyecto **antes** de versionar migraciones. Falta volcar ese
esquema completo a `supabase/migrations/` (pendiente en `porhacer.md`).
