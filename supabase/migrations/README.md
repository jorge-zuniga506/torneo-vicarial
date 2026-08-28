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
