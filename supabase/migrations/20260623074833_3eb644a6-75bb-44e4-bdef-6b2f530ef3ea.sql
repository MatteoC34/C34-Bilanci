
create or replace function public.claim_first_admin()
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  if exists (select 1 from public.user_roles where role = 'admin') then
    return false;
  end if;
  insert into public.user_roles(user_id, role) values (auth.uid(), 'admin') on conflict do nothing;
  return true;
end;
$$;
revoke execute on function public.claim_first_admin() from public, anon;
grant execute on function public.claim_first_admin() to authenticated;
