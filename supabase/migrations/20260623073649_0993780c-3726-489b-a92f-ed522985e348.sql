
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
revoke execute on function public.user_owns_client(uuid) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
