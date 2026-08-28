-- El `revoke ... from anon` original no bastaba (PUBLIC seguía teniendo el
-- grant y anon lo hereda). Se alinea con el resto de funciones de control:
-- revoke a PUBLIC + grant sólo a authenticated. Igual chequea is_admin()
-- adentro, pero así queda fuera del alcance de anon en la API.
revoke execute on function public.reset_match(uuid) from public;
revoke execute on function public.reset_match(uuid) from anon;
grant execute on function public.reset_match(uuid) to authenticated;
