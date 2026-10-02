-- Internal support tickets: baristas/staff report bugs (optional screenshot), admins triage.
-- Screenshot objects are removed by the admin client before the ticket moves to resolved/closed;
-- the update trigger then clears image_path so no row ever points at a deleted object.

create table if not exists public.kk_support_tickets (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.kk_profiles (id) on delete cascade,
  reporter_name text,
  reporter_email text,
  reporter_role text not null,
  branch_id text references public.kk_branches (id) on delete set null,
  title text not null check (char_length(btrim(title)) between 3 and 120),
  description text not null check (char_length(btrim(description)) between 1 and 4000),
  category text not null default 'bug' check (category in ('bug', 'order', 'menu', 'other')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'urgent')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  image_path text,
  admin_note text check (admin_note is null or char_length(admin_note) <= 2000),
  read_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kk_support_tickets_status_created_idx
  on public.kk_support_tickets (status, created_at desc);
create index if not exists kk_support_tickets_created_by_idx
  on public.kk_support_tickets (created_by, created_at desc);

-- Reporter identity, branch, and initial triage fields are server-authoritative.
create or replace function public.kk_support_tickets_before_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prof public.kk_profiles%rowtype;
begin
  select * into prof from public.kk_profiles where id = public.requesting_profile_id();
  if prof.id is null or prof.role not in ('admin', 'barista', 'staff') then
    raise exception 'Only team accounts can submit tickets.' using errcode = '42501';
  end if;
  new.created_by := prof.id;
  new.reporter_name := prof.name;
  new.reporter_email := prof.email;
  new.reporter_role := prof.role;
  new.branch_id := prof.branch_id;
  new.status := 'open';
  new.admin_note := null;
  new.read_at := null;
  new.resolved_at := null;
  new.created_at := now();
  new.updated_at := now();
  if new.image_path is not null and split_part(new.image_path, '/', 1) <> prof.id::text then
    raise exception 'Screenshot must be uploaded to your own folder.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.kk_support_tickets_before_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.created_by := old.created_by;
  new.reporter_name := old.reporter_name;
  new.reporter_email := old.reporter_email;
  new.reporter_role := old.reporter_role;
  new.branch_id := old.branch_id;
  new.created_at := old.created_at;
  new.updated_at := now();
  if new.status in ('resolved', 'closed') then
    new.image_path := null;
    if old.status not in ('resolved', 'closed') then
      new.resolved_at := now();
    end if;
  else
    new.resolved_at := null;
  end if;
  return new;
end;
$$;

revoke execute on function public.kk_support_tickets_before_insert() from public, anon, authenticated;
revoke execute on function public.kk_support_tickets_before_update() from public, anon, authenticated;

drop trigger if exists trg_kk_support_tickets_before_insert on public.kk_support_tickets;
create trigger trg_kk_support_tickets_before_insert
  before insert on public.kk_support_tickets
  for each row execute function public.kk_support_tickets_before_insert();

drop trigger if exists trg_kk_support_tickets_before_update on public.kk_support_tickets;
create trigger trg_kk_support_tickets_before_update
  before update on public.kk_support_tickets
  for each row execute function public.kk_support_tickets_before_update();

alter table public.kk_support_tickets enable row level security;
revoke all on public.kk_support_tickets from anon;
grant select, insert, update, delete on public.kk_support_tickets to authenticated;

drop policy if exists kk_support_tickets_select on public.kk_support_tickets;
create policy kk_support_tickets_select on public.kk_support_tickets
  for select to authenticated
  using (created_by = public.requesting_profile_id() or public.kk_current_role() = 'admin');

drop policy if exists kk_support_tickets_insert on public.kk_support_tickets;
create policy kk_support_tickets_insert on public.kk_support_tickets
  for insert to authenticated
  with check (public.kk_current_role() in ('admin', 'barista', 'staff'));

drop policy if exists kk_support_tickets_update_admin on public.kk_support_tickets;
create policy kk_support_tickets_update_admin on public.kk_support_tickets
  for update to authenticated
  using (public.kk_current_role() = 'admin')
  with check (public.kk_current_role() = 'admin');

drop policy if exists kk_support_tickets_delete_admin on public.kk_support_tickets;
create policy kk_support_tickets_delete_admin on public.kk_support_tickets
  for delete to authenticated
  using (public.kk_current_role() = 'admin');

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'kk_support_tickets'
  ) then
    alter publication supabase_realtime add table public.kk_support_tickets;
  end if;
end $$;

-- Private screenshot bucket: <profile_id>/<uuid>.<ext>
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'kado-ticket-images',
  'kado-ticket-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists kado_ticket_images_insert on storage.objects;
create policy kado_ticket_images_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'kado-ticket-images'
    and public.kk_current_role() in ('admin', 'barista', 'staff')
    and (storage.foldername(name))[1] = public.requesting_profile_id()::text
  );

drop policy if exists kado_ticket_images_select on storage.objects;
create policy kado_ticket_images_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'kado-ticket-images'
    and (
      public.kk_current_role() = 'admin'
      or (storage.foldername(name))[1] = public.requesting_profile_id()::text
    )
  );

drop policy if exists kado_ticket_images_delete on storage.objects;
create policy kado_ticket_images_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'kado-ticket-images'
    and (
      public.kk_current_role() = 'admin'
      or (storage.foldername(name))[1] = public.requesting_profile_id()::text
    )
  );
