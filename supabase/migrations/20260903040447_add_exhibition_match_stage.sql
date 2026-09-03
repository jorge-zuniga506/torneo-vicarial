-- Fase de exhibición (el partido femenino no es grupo ni llave del cuadro).
-- ALTER TYPE ... ADD VALUE va en su propia migración porque el valor nuevo no
-- puede usarse hasta que la transacción que lo agrega hace commit.
alter type public.match_stage add value if not exists 'EXHIBITION';
