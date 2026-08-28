alter table public.tournament_settings
  add column if not exists slot_minutes integer not null default 15;

comment on column public.tournament_settings.slot_minutes is
  'Minutos entre el inicio de un partido y el siguiente en el reprogramado automatico del calendario.';
