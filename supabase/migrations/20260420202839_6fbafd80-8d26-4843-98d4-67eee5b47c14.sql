create table if not exists public.family_zip_import_jobs (
  id uuid primary key default gen_random_uuid(),
  collage_id uuid not null references public.family_collages(id) on delete cascade,
  device_id text not null,
  source_file_name text not null,
  source_storage_path text not null,
  status text not null default 'queued',
  progress integer not null default 0,
  extracted_count integer not null default 0,
  uploaded_count integer not null default 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint family_zip_import_jobs_status_check check (status in ('queued','processing','completed','failed')),
  constraint family_zip_import_jobs_progress_check check (progress >= 0 and progress <= 100)
);

create index if not exists idx_family_zip_import_jobs_collage_id on public.family_zip_import_jobs(collage_id);
create index if not exists idx_family_zip_import_jobs_device_id on public.family_zip_import_jobs(device_id);
create index if not exists idx_family_zip_import_jobs_created_at on public.family_zip_import_jobs(created_at desc);

alter table public.family_zip_import_jobs enable row level security;

create or replace function public.set_family_zip_import_jobs_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

DROP TRIGGER IF EXISTS trg_family_zip_import_jobs_updated_at ON public.family_zip_import_jobs;
create trigger trg_family_zip_import_jobs_updated_at
before update on public.family_zip_import_jobs
for each row
execute function public.set_family_zip_import_jobs_updated_at();

-- no direct client access; jobs are managed only through backend functions
DROP POLICY IF EXISTS "No direct access to family_zip_import_jobs" ON public.family_zip_import_jobs;
create policy "No direct access to family_zip_import_jobs"
on public.family_zip_import_jobs
as restrictive
for all
to public
using (false)
with check (false);

alter publication supabase_realtime add table public.family_zip_import_jobs;