# Torneo Vicarial — Plataforma de torneo Fútbol 5

Plataforma web para administrar y mostrar **en vivo** un torneo de fútbol 5:
una página pública que se actualiza sola vía Supabase Realtime y un panel de
administración para controlar todo (equipos, jugadores, partidos, cronómetro,
tablas, cuadro y sorteo).

- **Frontend** (`frontend/`): React 19 + Vite + Tailwind v4 + React Router 7.
- **Backend** (`backend/`): Node + Express + TypeScript. **No se usa ni se
  despliega hoy** — todo el frontend habla directo con Supabase. Queda como
  alternativa por si más adelante hace falta lógica server-side.
- **Base de datos**: Supabase (PostgreSQL + Realtime + Auth), proyecto
  `TU-PROYECTO`.

> El estado de avance y lo que falta está en [`porhacer.md`](./porhacer.md).
> El detalle del esquema de base de datos está en
> [`docs/DATABASE.md`](./docs/DATABASE.md).

---

## Índice

1. [Cómo correrlo localmente](#cómo-correrlo-localmente)
2. [Variables de entorno](#variables-de-entorno)
3. [Conectar Supabase](#conectar-supabase)
4. [Crear el usuario administrador](#crear-el-usuario-administrador)
5. [Arquitectura y estructura](#arquitectura-y-estructura)
6. [Cómo funciona el tiempo real](#cómo-funciona-el-tiempo-real)
7. [El cronómetro](#el-cronómetro)
8. [Programación automática de horarios](#programación-automática-de-horarios)
9. [Notificaciones (toasts)](#notificaciones-toasts)
10. [Desplegar en Vercel](#desplegar-en-vercel)
11. [Keep-alive: que Supabase no pause el proyecto](#keep-alive-que-supabase-no-pause-el-proyecto)
12. [Migraciones](#migraciones)

---

## Cómo correrlo localmente

Requisitos: **Node 20+**.

```bash
# 1. Frontend
cd frontend
npm install
npm run dev          # http://localhost:5173

# 2. (Opcional) Backend — no hace falta para nada del flujo actual
cd ../backend
npm install
npm run dev          # http://localhost:3001
```

Scripts útiles del frontend:

| Comando            | Qué hace                                  |
| ----------------- | ----------------------------------------- |
| `npm run dev`     | servidor de desarrollo con HMR            |
| `npm run build`   | `tsc -b` + build de producción a `dist/`  |
| `npm run preview` | sirve el `dist/` ya construido            |
| `npm run lint`    | ESLint sobre todo `src/`                  |

**Antes de dar por buena cualquier cambio**: `npm run build` y `npm run lint`
tienen que pasar sin errores.

---

## Variables de entorno

### `frontend/.env.local`

```ini
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxx
# Opcional, sólo si se usa el backend:
VITE_BACKEND_URL=http://localhost:3001
```

La `anon key` (publishable) es pública por diseño: la seguridad la hace
**Row Level Security** en Postgres, no el secreto de la key.

### `backend/.env` (sólo si levantás el backend)

```ini
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_ANON_KEY=sb_publishable_xxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # ¡SECRETA! nunca al frontend ni a git
PORT=3001
FRONTEND_URL=http://localhost:5173
```

`.env.local` y `.env` están en `.gitignore`.

---

## Conectar Supabase

1. Supabase Dashboard → **Project Settings → API**: copiá la **Project URL** y
   la **publishable / anon key** a `frontend/.env.local`.
2. El esquema ya está aplicado en el proyecto. Si tenés que recrearlo en otro
   proyecto, aplicá las migraciones de `supabase/migrations/` (ver
   [Migraciones](#migraciones)) — o pedí el volcado completo del esquema.
3. **Realtime**: las tablas `matches`, `match_events`, `teams`, `players` y
   `standings` están en la publicación `supabase_realtime`. Si recreás el
   proyecto, hay que volver a agregarlas (Dashboard → Database → Replication).

---

## Crear el usuario administrador

El panel `/admin` exige sesión **con rol `ADMIN`**. El rol vive en
`public.profiles.role` (nunca en `user_metadata`).

1. Dashboard → **Authentication → Users → Add user** → email + contraseña,
   tildá **Auto Confirm User**.
2. Un trigger (`handle_new_user`) ya te crea la fila en `public.profiles` con
   `role = 'VIEWER'`. Ascendé ese usuario:

   ```sql
   update public.profiles set role = 'ADMIN'
   where id = (select id from auth.users where email = 'TU_EMAIL');
   ```

3. Recargá `/admin` (la app lee el rol al cargar). Entrada al panel: pie de
   página del sitio → **"Panel de administración"**, o directo `/admin/login`.

`VIEWER` = sólo lectura (RLS lo bloquea igual si intenta escribir).

---

## Arquitectura y estructura

**Regla de oro**: la lógica de negocio (marcador, eventos, cronómetro,
recálculo de tablas, avance del cuadro) vive en **funciones de Postgres**. El
frontend sólo las llama; nunca duplica esa matemática. Así frontend y (futuro)
backend no se pueden desincronizar.

```
frontend/src/
├── components/        UI compartida: MatchRow, StandingsTable, TeamBadge,
│   │                  LiveMatchHero, NextMatchCard, StatusBanners, ComingSoon,
│   │                  TournamentToasts
│   └── admin/         StatCard, RouletteWheel
├── contexts/          AuthContext (sesión Supabase + isAdmin desde profiles)
├── hooks/             useTournament, useMatches, useMatch, useMatchEvents,
│                      useStandings, useTeams, useGroups, usePlayers,
│                      useTournamentPlayers, usePlayerStats, useLiveMatch,
│                      useTournamentToasts, useAuth
├── layouts/           PublicLayout (header/nav/footer) · AdminLayout (sidebar + guard)
├── lib/               supabase (cliente) · api (fetch al backend) · toast (sileo)
├── pages/             HomePage, TeamsPage, TeamDetailPage, FixturesPage,
│   │                  StandingsPage, BracketPage, ChampionPage, NotFoundPage (404)
│   └── admin/         AdminLoginPage, AdminDashboardPage, AdminTeamsPage,
│                      AdminPlayersPage, AdminMatchesPage, AdminMatchControlPage,
│                      AdminStandingsPage, AdminRoulettePage
├── services/          Una por dominio: tournament, teams, players, matches,
│                      matchEvents, matchControl, standings, groups,
│                      playerStats, roulette
├── types/             database.ts (generado de Supabase) · tournament.ts (alias)
└── utils/             matchClock, matchLabels, tournamentStatus, schedule
```

### Rutas

| Ruta                    | Página                        |
| ----------------------- | ----------------------------- |
| `/`                     | Home (hero en vivo, tablas, goleadores, próximos) |
| `/fixtures`             | Partidos: tabs En vivo / Próximos / Finalizados + filtros |
| `/standings`            | Tablas de posiciones por grupo + clasificados a cuartos |
| `/bracket`              | Cuadro de eliminación (QF → SF → final) |
| `/teams` · `/teams/:id` | Equipos y detalle (plantel, resultados) |
| `/champion`             | Pantalla de campeón           |
| `/tv`                   | Modo TV: marcador deportivo persistente + banner de gol/final + overlay de tabla; botón "Salir" e indicador de conexión |
| `*`                     | 404 de marca                  |
| `/admin/login`          | Login                         |
| `/admin`                | Resumen (contadores + estado del torneo) |
| `/admin/teams`          | CRUD equipos                  |
| `/admin/players`        | CRUD jugadores + capitán + stats |
| `/admin/matches`        | CRUD partidos + reprogramar por drag & drop |
| `/admin/matches/:id`    | **Control en vivo** (cronómetro, goles, tarjetas) |
| `/admin/standings`      | Clasificación: desempate manual + **Sortear cuartos** |
| `/admin/roulette`       | Ruleta: sorteo de posiciones / elegir equipo / elegir jugador |

### Seguridad

- **RLS en todas las tablas.** Lectura pública; escritura sólo si
  `private.is_admin()` (que lee `profiles.role`). `standings` no tiene ruta de
  escritura desde el cliente (la escribe sólo `recalculate_standings`).
- Las funciones de control de partido (`record_goal`, `start_match`, …) son
  `SECURITY DEFINER` y **chequean admin internamente** (lanzan `42501` si no).
- El panel habla directo con Supabase (anon key + sesión). El chequeo de rol en
  el cliente sólo decide **qué se muestra**; quien lo saltee choca con RLS.

Ver el detalle completo en [`docs/DATABASE.md`](./docs/DATABASE.md).

---

## Cómo funciona el tiempo real

Cada hook de datos (`useMatches`, `useStandings`, `useTeams`, `useMatchEvents`,
…) hace: **carga inicial** + **suscripción a `postgres_changes`** en su tabla.
Ante cualquier `INSERT`/`UPDATE`/`DELETE`, vuelve a leer y React re-renderiza.
No hace falta recargar la página.

**Plan B (sondeo):** además del WebSocket, cada hook **re-consulta cada 15 s**
(20 s `useTournament`) mientras la pestaña está visible, y al volver la conexión
(`online`) o la pestaña. Así la app se actualiza aunque la red o el dispositivo
bloqueen el WebSocket de Realtime. El nombre de canal lleva un sufijo único por
instancia (`useId()`) para que un mismo hook usado dos veces en el árbol (p. ej.
`/tv`) no comparta canal.

Los hooks con `refetch` (`useMatch`, `useMatchEvents`) además fuerzan una
relectura inmediata después de cada acción del admin, para no depender de que
el evento de Realtime llegue a tiempo.

---

## El cronómetro

El tiempo **nunca** se cuenta sumando localmente. Se guarda en la base:

| Campo de `matches` | Significado                                       |
| ------------------ | ------------------------------------------------- |
| `started_at`       | cuándo arrancó el período actual (null si en pausa) |
| `elapsed_seconds`  | segundos acumulados antes del último arranque     |
| `paused_at`        | cuándo se pausó                                   |
| `current_period`   | `PRE` / `FIRST_HALF` / `HALFTIME` / `SECOND_HALF` / `ENDED` |

El frontend calcula `elapsed = elapsed_seconds + (now - started_at)` con un
reloj `now` que avanza cada segundo (y al volver a la pestaña). Todos los
espectadores parten del mismo dato → ven aproximadamente lo mismo.

Acciones (RPC): `start_match`, `pause_match`, `resume_match`, `start_halftime`,
`start_second_half`, `finish_match`, `reset_match`.

---

## Formato del torneo

9 equipos masculinos + **1 partido femenino** de exhibición
(`category='FEMENINO'`, `stage='EXHIBITION'`, no afecta tablas/cuadro/stats
masculinas). 3 grupos de 3, todos contra todos. Clasifican **8 de 9** a
cuartos: 2 por grupo (`qualifiers_per_group`) + 2 mejores terceros
(`best_third_places`); el peor 3.º queda eliminado. Cuartos → semis → final →
campeón (los ganadores avanzan solos por `*_source_match_id`). El sorteo de
cuartos lo dispara el admin en `/admin/standings` (RPC `draw_quarterfinals`).

Desempate en grupos: PTS → DG → GF → resultado entre los empatados (H2H) →
`teams.manual_tiebreak` (flechas en `/admin/standings`) → nombre.

## Programación automática de horarios

En `/admin/matches` la lista es cronológica y **se arrastra** cada partido de
la manija. Al soltar, se recalculan **todos** los horarios desde
`tournament_settings.tournament_start_time`, uno cada
`tournament_settings.slot_minutes` (editable en la página), empujando fuera de
la pausa (`break_start_time` / `break_end_time`). Lógica en
`frontend/src/utils/schedule.ts`.

El cronograma inicial (grupos 13:00–14:36, femenino 14:48, pausa 15:00–15:50,
cuartos 15:50–16:26, semis 16:45/16:57, final 17:20, con huecos de preparación
de 7 min antes de semis y final) se fijó una vez en la migración
`seed_womens_match_and_reschedule`. Un "Recalcular horarios" normaliza esos
huecos a `slot_minutes` uniforme.

Nada está hardcodeado: cantidad de equipos, grupos, clasificados, duración de
tiempos, horarios y desempates viven todos en `tournament_settings`.

---

## Notificaciones (toasts)

Librería: [`sileo`](https://github.com/hiaaryan/sileo).

- **Eventos en vivo** (`useTournamentToasts`, montado en `main.tsx`): escucha
  Realtime y dispara *¡GOL!*, *Comenzó el partido*, *Entretiempo*, *Segundo
  tiempo*, *Final*, tarjetas y *¡Tenemos campeón!* — arriba al centro.
- **Confirmaciones de acciones** (`lib/toast.ts` → `toast.ok/info/warn/err`):
  cada alta/edición/baja del panel y cada acción del control en vivo — abajo a
  la derecha; los errores, arriba al centro.

---

## Desplegar en Vercel

Sólo se despliega `frontend/` (SPA estática). El backend no.

1. Subí el repo a GitHub e importalo en Vercel.
2. En el proyecto de Vercel: **Root Directory = `frontend`**.
   `frontend/vercel.json` ya define framework `vite`, build `npm run build`,
   output `dist`, un *rewrite* de SPA (para que `/admin`, `/standings`, etc. no
   den 404 al recargar; excluye `/api/*`) y un **cron** diario que pega al
   keep-alive (ver más abajo). La función `frontend/api/keep-alive.js` se
   despliega sola como `/api/keep-alive`.
3. **Settings → Environment Variables** (Production + Preview):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Supabase → Authentication → URL Configuration**: agregá el dominio de
   Vercel a *Site URL* y *Redirect URLs*, o el login falla en producción.

---

## Keep-alive: que Supabase no pause el proyecto

El plan free de Supabase **pausa el proyecto tras ~7 días sin actividad**. Para
evitarlo hay un latido que hace una **escritura real** cada pocos días.

**En la base** (una sola vez, ya aplicado):

| Pieza                             | Qué es                                                        |
| --------------------------------- | ----------------------------------------------------------- |
| tabla `public.keepalive`          | una fila (`id = 1`) con `last_ping` y `pings`. RLS activado, sin policies. |
| función `public.ping_keepalive()` | `SECURITY DEFINER`; hace `UPDATE keepalive` y devuelve `last_ping`. `EXECUTE` para `anon`. |

**Dos pingers redundantes** (si uno falla, el otro cubre — disparan a horas
distintas):

| Pinger | Archivo | Cadencia |
| ------ | ------- | -------- |
| **GitHub Actions** | `.github/workflows/keep-alive.yml` → `scripts/keep-alive.mjs` | cada 3 días, 06:17 UTC (`17 6 */3 * *`) + botón manual |
| **Vercel Cron** | `frontend/vercel.json` (`crons`) → `frontend/api/keep-alive.js` | diario, 07:00 UTC (`0 7 * * *`) |

### Activar el pinger de GitHub Actions

1. El repo tiene que estar en GitHub.
2. **Settings → Secrets and variables → Actions → New repository secret**:
   - `SUPABASE_URL` = `https://TU-PROYECTO.supabase.co`
   - `SUPABASE_ANON_KEY` = la publishable key
3. Listo. Probar ya: pestaña **Actions → keep-alive → Run workflow**.

### Activar el pinger de Vercel Cron

Se activa **solo** al desplegar en Vercel (el `crons` de `vercel.json` ya está).
Sólo necesita que en Vercel existan las env vars `VITE_SUPABASE_URL` y
`VITE_SUPABASE_ANON_KEY` (las mismas del build — la función las reutiliza).
Probar a mano: abrí `https://TU-DOMINIO.vercel.app/api/keep-alive` → debe
responder `{"ok":true,...}`.

> Si tu plan de Vercel no permite cron jobs, borrá el bloque `"crons"` de
> `vercel.json`; con el de GitHub alcanza.

### Correrlo a mano / desde otro cron

```bash
# Lee frontend/.env.local automáticamente:
node scripts/keep-alive.mjs

# O explícito:
SUPABASE_URL=https://xxxx.supabase.co SUPABASE_ANON_KEY=sb_publishable_xxx \
  node scripts/keep-alive.mjs
```

Sale `[keep-alive] OK ...` y termina con código 0; ante error, código 1.

### Cómo APAGAR el keep-alive (cuando el sitio ya tenga uso real)

Una vez que el sitio recibe visitas de verdad, cada carga de página ya llama a
Supabase → el keep-alive deja de hacer falta. Para desactivarlo:

1. **GitHub Actions**: repo → pestaña **Actions** → workflow **keep-alive** →
   botón **⋯** → **Disable workflow**. (O borrá `.github/workflows/keep-alive.yml`.)
2. **Vercel Cron**: borrá el bloque `"crons"` de `frontend/vercel.json` y
   volvé a desplegar. (Opcional: borrá también `frontend/api/keep-alive.js`.)
3. **La base** (opcional, es inofensivo dejarlo): podés dropear la tabla y la
   función con
   `drop function public.ping_keepalive(); drop table public.keepalive;`

No hay que tocar nada más: son 100% independientes del funcionamiento del
sitio.

---

## Migraciones

Aplicadas en el proyecto (vía Supabase MCP / `apply_migration`):

| Versión          | Nombre                                     |
| ---------------- | ------------------------------------------ |
| `20260828190920` | `add_slot_minutes_to_tournament_settings`  |
| `20260828192916` | `add_reset_match_function`                 |
| `20260828203813` | `add_keepalive`                            |
| `20260828212443` | `tighten_reset_match_grants`               |
| `20260903040437` | `update_tournament_format_settings`        |
| `20260903040447` | `add_exhibition_match_stage`               |
| `20260903040455` | `add_match_and_team_category`              |
| `20260903040501` | `add_team_manual_tiebreak`                 |
| `20260903040542` | `improve_recalculate_standings_tiebreakers` |
| `20260903040649` | `add_draw_quarterfinals`                   |
| `20260903040717` | `champion_on_final_finish`                 |
| `20260903040818` | `seed_womens_match_and_reschedule`         |
| `20260903050810` | `add_simulation_helpers`                   |

El SQL de cada una está en `supabase/migrations/`.

> El esquema base (10 tablas, enums, funciones, triggers, RLS, seed) se aplicó
> directo al proyecto remoto antes de empezar a versionar migraciones, así que
> **no hay un archivo SQL del esquema completo en el repo todavía** — es una
> tarea pendiente en `porhacer.md`. Para clonar el proyecto a otro Supabase,
> pedí el volcado o usá `supabase db pull`.
