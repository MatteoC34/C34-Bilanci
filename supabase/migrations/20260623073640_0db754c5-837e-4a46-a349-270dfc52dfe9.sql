
create policy "bilanci admin all" on storage.objects for all to authenticated
  using (bucket_id = 'bilanci' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'bilanci' and public.has_role(auth.uid(), 'admin'));
create policy "bilanci client read own" on storage.objects for select to authenticated
  using (bucket_id = 'bilanci' and public.user_owns_client( ((storage.foldername(name))[1])::uuid ));
