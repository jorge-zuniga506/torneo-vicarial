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

| Enum           | Valores                                                                                     |
| -------------- | ------------------------------------------------------------------------------------------- |
| `user_role`    | `ADMIN`, `VIEWER`                                                                           |
| `match_stage`  | `GROUP`, `QUARTERFINAL`, `SEMIFINAL`, `FINAL`, `THIRD_PLACE`                                |
| `match_status` | `PROGRAMADO`, `CALENTAMIENTO`, `EN_JUEGO`, `DESCANSO`, `FINALIZADO`, `SUSPENDIDO`, `CANCELADO` |
| `match_period` | `PRE`, `FIRST_HALF`, `HALFTIME`, `SECOND_HALF`, `ENDED`                                     |
| `event_type`   | `GOAL`, `YELLOW_CARD`, `RED_CARD`, `SUBSTITUTION`, `START`, `HALFTIME`, `RESUME`, `END`     |

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
`matches_per_team_group_stage` (2), `qualifiers_per_group` (1),
`best_third_places` (0), `elimination_format` (`QUARTERFINAL` / `SEMIFINAL` /
`FINAL_ONLY`), `first_half_minutes` (5), `halftime_minutes` (1),
`second_half_minutes` (5), `slot_minutes` (15 — minutos entre partidos en el
reprogramado automático), `tournament_start_time` (12:00),
`tournament_end_time` (18:00), `break_start_time` (15:00),
`break_end_time` (15:50), `tiebreaker_order jsonb`
(`["POINTS","GOAL_DIFF","GOALS_FOR","HEAD_TO_HEAD","FAIR_PLAY","RANDOM"]`).

### `groups`
`tournament_id`, `name` ("A" / "B" / "C"), `display_order`.

### `teams`
`tournament_id`, `group_id` (nullable), `name`, `short_name`, `logo_url`,
`color`, `captain_player_id`, `fair_play_points numeric`.

### `players`
`team_id`, `name`, `jersey_number`, `position`, `photo_url`.

### `matches`
`tournament_id`, `stage match_stage`, `group_id` (nullable),
`bracket_slot` (`"QF1"`, `"SF1"`, `"FINAL"`, …), `matchday`,
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
| `reset_match` | `p_match_id` | vuelve a `PROGRAMADO` / `PRE`, 0-0, borra eventos y cronómetro, limpia el equipo en llaves que salían de este partido, y `recalculate_standings` si es de grupos. |
| `recalculate_standings` | `p_tournament_id` | **borra y reconstruye** todas las filas de `standings` del torneo desde los partidos `FINALIZADO` de grupos. Orden por `points`, `goal_diff`, `goals_for` (los demás criterios de `tiebreaker_order` están **pendientes**). |
| `ping_keepalive` | — | `UPDATE keepalive` (latido). `EXECUTE` para `anon` / `authenticated`. |

---

## Triggers

Sobre `matches`:

| Trigger | Cuándo | Función | Efecto |
| ------- | ------ | ------- | ------ |
| `matches_before_update` | `BEFORE UPDATE` | `matches_set_winner` | si pasa a `FINALIZADO` y hay diferencia de gol, setea `winner_team_id`. Siempre `updated_at = now()`. |
| `matches_after_update`  | `AFTER UPDATE`  | `matches_after_finish` | si quedó `FINALIZADO`: propaga el ganador a los partidos cuyo `home/away_source_match_id` es este (avance del cuadro) y, si es de grupos, corre `recalculate_standings`. |

Sobre `auth.users`: `handle_new_user` crea el `profiles` al registrarse.

> Nota: `matches_set_winner` sólo setea el ganador si estaba `null`. Corregir
> el marcador de un partido ya finalizado que cambia quién ganó **no**
> actualiza `winner_team_id` ni el cuadro (pendiente en `porhacer.md`).

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
| `add_keepalive`  | tabla `keepalive` + función `ping_keepalive()` |

El esquema base (10 tablas + enums + funciones + triggers + RLS + seed) se
aplicó al proyecto **antes** de versionar migraciones. Falta volcar ese
esquema completo a `supabase/migrations/` (pendiente en `porhacer.md`).
