insert into storage.buckets (id, name, public)
values ('family-zip-imports', 'family-zip-imports', false)
on conflict (id) do nothing;

DROP POLICY IF EXISTS "Anyone can upload family zip imports" ON storage.objects;
create policy "Anyone can upload family zip imports"
on storage.objects
for insert
to public
with check (bucket_id = 'family-zip-imports');

DROP POLICY IF EXISTS "Anyone can update family zip imports" ON storage.objects;
create policy "Anyone can update family zip imports"
on storage.objects
for update
to public
using (bucket_id = 'family-zip-imports')
with check (bucket_id = 'family-zip-imports');

DROP POLICY IF EXISTS "Anyone can delete family zip imports" ON storage.objects;
create policy "Anyone can delete family zip imports"
on storage.objects
for delete
to public
using (bucket_id = 'family-zip-imports');