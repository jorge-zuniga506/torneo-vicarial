# Por hacer - Plataforma Torneo Fut 5

Sistema web para administrar y mostrar en vivo un torneo de futbol 5.
Stack: React 19 + Vite + Tailwind v4 + React Router 7 (`frontend/`), Node +
Express + TS (`backend/`), Supabase (Postgres + Realtime + Auth), proyecto
`TU-PROYECTO`.

> El `porhacer.md` anterior (sitio del Ministerio) quedo obsoleto: este
> proyecto se reconvirtio en la plataforma del torneo. Identidad visual: se
> usa el skill `brand-palette` (tema claro, crema + azul/violeta/vino, logo
> cruz-en-circulo). Sin emojis en toda la UI (iconos = lucide-react).

## Fase 1 - Infraestructura y datos  [hecho]

- [x] **Esquema Supabase** completo: `profiles, tournaments,
      tournament_settings, groups, teams, players, matches, match_events,
      standings, roulette_draws` - UUID, FKs, enums, checks, RLS activado.
      Enums: `match_status` (7), `match_period`, `match_stage`, `event_type`
      (8), `user_role`. Columnas de bracket (`home_source_match_id`,
      `away_source_match_id`, `bracket_slot`).
- [x] **RLS**: SELECT publico en todo; escritura solo si `private.is_admin()`
      (lee `profiles.role`). `standings` sin ruta de escritura desde cliente.
- [x] **Logica en Postgres**: `record_goal`, `record_card`, `undo_goal`,
      `set_match_score`; cronometro `start/pause/resume/start_halftime/
      start_second_half/finish_match` (por timestamps); `recalculate_standings`
      (borra y reconstruye desde cero, editar un resultado es seguro);
      triggers `matches_set_winner` + `matches_after_finish` (avance
      automatico del bracket + recalculo de tabla); vista `player_stats`
      (goles/asistencias/tarjetas agregadas de `match_events`).
- [x] **Realtime** activo en `matches, match_events, teams, players, standings`.
- [x] **Seed**: 1 torneo (`SETUP`), 3 grupos A/B/C, 9 equipos (A1..C3), 16
      partidos (9 de grupos + 4 QF + 2 SF + final, bracket precableado a
      SF/FINAL), 9 filas de standings. Sin jugadores ni eventos.
- [x] **Backend**: `index.ts` + CORS + error handler; `requireAuth` /
      `requireAdmin`; `supabaseForRequest` (respeta RLS) / `supabaseAdmin`;
      services+controllers+routes de teams, players, matches, standings,
      tournament; endpoints de partido (`/events`, `/score`, `/clock`) que
      delegan en las RPC; `/tournament/start|end`.
- [x] **Frontend base**: routing (`main.tsx`), `AuthContext`/`useAuth`,
      `AdminLoginPage`, `AdminLayout` (guard sesion+admin), `PublicLayout`,
      hooks realtime (`useMatches`, `useStandings`, `useTeams`,
      `useMatchEvents`, `useLiveMatch`, `useTournament`), utils
      `matchClock` (reloj por timestamps) y `tournamentStatus` (pausa,
      countdown), componentes `LiveMatchHero`, `NextMatchCard`,
      `StatusBanners`, `TeamBadge`.

## Fase 2 - Paginas publicas  [en curso]

- [x] `useGroups`, `usePlayers`, `usePlayerStats` + servicios
      (`groups`, `players`, `playerStats`).
- [x] Componentes compartidos `MatchRow`, `StandingsTable`; utils
      `matchLabels` (labels/estilos de estado y fase).
- [x] `/standings` - tablas por grupo, realtime, resalta plazas de
      clasificacion (`qualifiers_per_group`).
- [x] `/fixtures` - tabs En vivo / Proximos / Finalizados + filtros por
      grupo y fase, contadores, orden por hora. Lee `?tab=` y `?filtro=`.
- [x] `/teams` - cards por grupo con PJ/V/E/D, goles y PTS (de standings).
- [x] `/teams/:id` - header, resumen, plantel (con goles por jugador),
      resultados y proximos partidos.
- [x] `HomePage` ampliada: hero en vivo / proximo / pausa / finalizado +
      resultados recientes + preview de tablas + proximos + goleadores +
      ficha de formato/horario.
- [x] Restyle completo a la paleta de marca (`brand-palette`): tokens en
      `index.css`, tema claro, logo real en headers + favicon, cero emojis
      (iconos de evento/estado pasados a lucide-react).
- [ ] `/champion` - pantalla de campeon (subcampeon, goleador, MVP, fair
      play, animacion). Requiere que algo setee `champion_team_id` /
      `runner_up_team_id`.
- [ ] Cuadro de eliminacion visual (bracket) - pagina o seccion en Home.
- [x] Toasts en vivo con `sileo` (lib de toasts para React). `<Toaster/>` +
      `<TournamentToasts/>` en `main.tsx`; hook `useTournamentToasts` escucha
      Realtime (`match_events` INSERT + `tournaments` UPDATE) y dispara:
      GOL, inicio, entretiempo, segundo tiempo, final, tarjetas, campeon.
      Nota: `sileo` es muy nuevo (v0.1.5, 1 maintainer); si hace falta algo
      mas probado: `sonner` / `react-hot-toast`.
- [x] Toast en TODA accion del admin via helper `lib/toast.ts`
      (`toast.ok/info/warn/err`): equipos, jugadores, partidos, horarios,
      control en vivo (clock/gol/tarjeta/score/undo/reset), estado del
      torneo, ruleta, login, logout. Confirmaciones abajo-derecha; errores
      y eventos en vivo arriba-centro.
- [x] Pagina 404 de marca (`pages/NotFoundPage.tsx`): logo, "404" en
      degradado, "Volver al inicio" + accesos a Partidos/Tablas/Equipos.
      Ruta catch-all `path="*"` en el grupo publico y en el de admin.
- [x] `frontend/vercel.json` (framework vite, rewrite SPA). Deploy: Root
      Directory = `frontend`, env vars `VITE_SUPABASE_URL` +
      `VITE_SUPABASE_ANON_KEY` en Vercel, y agregar el dominio a Supabase
      Auth URL Configuration. El backend no se despliega (todo va directo
      a Supabase).

## Fase 3 - Panel admin  [casi listo]

- [x] `/admin` dashboard: contadores (equipos, jugadores, partidos,
      finalizados/por jugar, goles, tarjetas A/R, cupos de clasificacion,
      partido actual, proximo) + botones Iniciar / Pausar / Finalizar /
      Reabrir torneo (update directo a `tournaments` via RLS).
- [x] `/admin/teams` - CRUD equipos (nombre, corto, color, grupo, logo_url).
      Falta: elegir capitan (necesita jugadores cargados).
- [x] `/admin/matches` - CRUD partidos (fase, grupo/jornada, local,
      visitante, fecha-hora, cancha, estado). Cada fila enlaza al control.
- [x] `/admin/matches` - **reprogramado por drag & drop**: lista cronologica
      unica, se arrastra un partido de la manija y al soltar se recalculan
      TODOS los horarios desde `tournament_start_time` cada `slot_minutes`
      (columna nueva en `tournament_settings`, default 15, editable en la
      pagina), empujando fuera de la pausa. Divisor "PAUSA" en la lista.
      Utils en `utils/schedule.ts`, batch update `updateMatchTimes`.
      HTML5 DnD nativo -> solo mouse (admin es desktop-first).
- [x] `/admin/matches/:id` - **control en vivo**: cronometro (iniciar /
      pausar / reanudar / descanso / 2.o tiempo / finalizar segun estado),
      gol y tarjetas por equipo (con selector de jugador opcional),
      corregir marcador manual, feed de eventos con "deshacer" en goles.
      Todo via RPC (`record_goal`, `record_card`, `undo_goal`,
      `set_match_score`, `start/pause/...`).
- [x] `/admin/players` - CRUD jugadores (dorsal, posicion, foto url),
      marcar capitan (estrella -> `teams.captain_player_id`), stats
      G/A/tarjetas por jugador (de la vista `player_stats`).
- [x] `/admin/roulette` - ruleta SVG animada. Modos: Equipos, Jugadores,
      Sorteo de grupos. Quitar del sorteo / Restablecer. El sorteo de
      grupos asigna `teams.group_id` y guarda en `roulette_draws`;
      "Registrar resultado" guarda un `RANDOM_SELECTION`.
- [x] Nav admin en mobile (barra superior scrollable; el sidebar era
      `sm:` y no habia alternativa) + link "Panel de administracion" en el
      footer publico.
- [x] Links "volver al sitio" en todo el admin: sidebar ("Ver sitio
      publico"), barra mobile, pantalla de "sin rol admin", y pagina de
      login ("Volver al sitio").
- [x] Fix "al iniciar partido se queda pegado": `useMatch` / `useMatchEvents`
      exponen `refetch` (nonce) y el control en vivo fuerza relectura
      despues de cada accion, sin depender solo de Realtime.
- [x] Fix cronometro congelado: el ticker de 1s ya no depende de `running`
      (antes `useTick(running)` no arrancaba si el estado tardaba). Ahora un
      `now` en estado que avanza cada segundo (y al volver a la pestana)
      alimenta `elapsedNowSeconds(match, now)` / `remainingSeconds(...)`.
      Aplicado a `AdminMatchControlPage` y `useLiveMatch`. El tiempo sigue
      calculado desde `started_at` en la base (sincronizado entre todos).
- [x] `reset_match(p_match_id)` (migracion `add_reset_match_function`) +
      boton "Reiniciar partido" en el control (0-0, PROGRAMADO, borra
      eventos y cronometro, limpia llaves derivadas, recalcula tabla).
- [x] Ruleta "Sorteo de posiciones": textarea de nombres (uno por linea),
      cada giro asigna un nombre al siguiente slot (A1, A2, ...), renombra
      ese equipo, le pone el grupo y lo registra en `roulette_draws`. Modos
      "Elegir equipo/jugador" quedan como seleccion aleatoria.
      La ruleta ahora gira con 1 solo elemento (antes exigia >=2 y el
      ultimo nombre quedaba trabado): con n==1 no anima, asigna directo
      ("Asignar el ultimo"). Toast (sileo) por cada equipo asignado
      ("Equipo N/9 asignado - A1 - <nombre>") + toast final "Sorteo completo".

## Fase 4 - Logica pendiente  [pendiente]

- [ ] `calculateQualifiedTeams` / mejores terceros: poblar QF1..QF4 desde
      standings (hoy los QF no tienen equipos). `best_third_places` sin usar.
- [ ] Desempates completos: `recalculate_standings` hoy solo hace
      PTS, luego DG, luego GF. Falta head-to-head / fair-play / sorteo del
      `tiebreaker_order`.
- [ ] Setear campeon/subcampeon al finalizar la final.
- [ ] `matches_set_winner` no re-calcula `winner_team_id` si ya estaba
      seteado: corregir el marcador de un partido ya finalizado que cambia
      quien gano no actualiza el ganador (ni el bracket). Menor para MVP.
- [ ] Volcar el esquema + seed a `supabase/migrations/` (hoy no hay archivo
      SQL en el repo; `list_migrations` vacio).
- [ ] Agregar `requireAdmin` a las rutas de partido del backend (hoy solo
      `requireAuth`; las RPC igual re-chequean admin, pero da 403 mas limpio).

## Pasos manuales (los hace la persona, no el asistente)

1. Crear usuario admin en Dashboard, Authentication, Users, Add user
   (Auto Confirm). Luego:
   ```sql
   update public.profiles set role = 'ADMIN'
   where id = (select id from auth.users where email = 'TU_EMAIL');
   ```
2. Confirmar `SUPABASE_SERVICE_ROLE_KEY` real en `backend/.env`.
3. Levantar: `cd backend && npm i && npm run dev` (:3001) y
   `cd frontend && npm i && npm run dev` (:5173).

- [x] Documentacion: `README.md` (setup, arquitectura, deploy, keep-alive) +
      `docs/DATABASE.md` (esquema, RPC, triggers, RLS, realtime). Migraciones
      incrementales volcadas a `supabase/migrations/` (falta el esquema base).
      `.gitignore` de raiz (protege `.env`).
- [x] Keep-alive anti-pausa de Supabase: tabla `keepalive` + funcion
      `ping_keepalive()` (migracion `add_keepalive`). DOS pingers redundantes:
      (a) `.github/workflows/keep-alive.yml` -> `scripts/keep-alive.mjs`
      (cron cada 3 dias; secrets `SUPABASE_URL`+`SUPABASE_ANON_KEY`);
      (b) Vercel Cron en `frontend/vercel.json` -> `frontend/api/keep-alive.js`
      (diario, se activa solo al desplegar). Como apagarlos: ver README
      seccion "Como APAGAR el keep-alive".

## Notas

- Paleta (skill `brand-palette`): tokens `@theme` en `index.css` - `azul-*`
  (`#0d3060`, acento primario/CTA), `viol-*` (`#5a1f4d`), `vino-*` (`#99122f`,
  tambien estado EN VIVO), superficies `crema`/`panel`, texto `tinta`/
  `tinta-2`/`tinta-3`, bordes `linea`. Degradado de marca: `.bg-marca` /
  `.text-marca`. Fuente Inter. Tema claro. Sin emojis (iconos lucide-react).
- Logo real en `frontend/src/assets/logo.png` (512) y
  `frontend/public/favicon.png` (64), generados de `LOGOPRINCIPAL.png`
  con `sips`.
- Todo lo configurable vive en `tournament_settings` - no hardcodear
  cantidades, horarios ni duraciones.
- Un solo torneo activo a la vez (`fetchActiveTournament` = el mas reciente).
