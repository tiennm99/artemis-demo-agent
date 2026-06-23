create extension if not exists pgcrypto;

do $$
declare
  schema_name text;
begin
  foreach schema_name in array array['artemis', 'artemis_preview']
  loop
    execute format('create schema if not exists %I', schema_name);

    execute format($sql$
      create table if not exists %I.profiles (
        id uuid primary key references auth.users(id) on delete cascade,
        email text not null unique,
        auth_provider text not null default 'google' check (auth_provider = 'google'),
        display_name text,
        domain text unique,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    $sql$, schema_name);

    execute format($sql$
      create table if not exists %I.lost_items (
        id uuid primary key default gen_random_uuid(),
        owner_profile_id uuid not null references %I.profiles(id) on delete cascade,
        description text not null check (char_length(description) between 3 and 2000),
        occurred_at_text text not null check (char_length(occurred_at_text) between 1 and 500),
        status text not null default 'open' check (status in ('open', 'matched', 'returned', 'closed', 'hidden')),
        image_metadata jsonb,
        payload jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    $sql$, schema_name, schema_name);

    execute format($sql$
      create table if not exists %I.found_items (
        id uuid primary key default gen_random_uuid(),
        owner_profile_id uuid not null references %I.profiles(id) on delete cascade,
        description text not null check (char_length(description) between 3 and 2000),
        occurred_at_text text not null check (char_length(occurred_at_text) between 1 and 500),
        location text not null check (char_length(location) between 1 and 500),
        status text not null default 'open' check (status in ('open', 'matched', 'returned', 'closed', 'hidden')),
        image_metadata jsonb,
        payload jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    $sql$, schema_name, schema_name);

    execute format($sql$
      create table if not exists %I.match_candidates (
        id uuid primary key default gen_random_uuid(),
        lost_item_id uuid not null references %I.lost_items(id) on delete cascade,
        found_item_id uuid not null references %I.found_items(id) on delete cascade,
        score integer not null check (score between 0 and 100),
        level text not null check (level in ('strong', 'near')),
        payload jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        unique (lost_item_id, found_item_id)
      )
    $sql$, schema_name, schema_name, schema_name);

    execute format($sql$
      create table if not exists %I.marketplace_listings (
        id uuid primary key default gen_random_uuid(),
        owner_profile_id uuid not null references %I.profiles(id) on delete cascade,
        name text not null check (char_length(name) between 2 and 180),
        quantity integer not null default 1 check (quantity between 1 and 999),
        description text not null check (char_length(description) between 3 and 3000),
        price_text text not null check (char_length(price_text) between 1 and 300),
        contact text not null check (char_length(contact) between 1 and 500),
        status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'hidden', 'passed')),
        image_metadata jsonb,
        payload jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )
    $sql$, schema_name, schema_name);

    execute format($sql$
      create table if not exists %I.marketplace_interests (
        listing_id uuid not null references %I.marketplace_listings(id) on delete cascade,
        profile_id uuid not null references %I.profiles(id) on delete cascade,
        created_at timestamptz not null default now(),
        primary key (listing_id, profile_id)
      )
    $sql$, schema_name, schema_name, schema_name);

    execute format($sql$
      create table if not exists %I.notifications (
        id uuid primary key default gen_random_uuid(),
        recipient_profile_id uuid not null references %I.profiles(id) on delete cascade,
        type text not null check (type in ('radar', 'match', 'marketplace', 'admin')),
        message text not null check (char_length(message) between 1 and 1000),
        delivery_key text not null unique,
        read_at timestamptz,
        payload jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now()
      )
    $sql$, schema_name, schema_name);

    execute format($sql$
      create table if not exists %I.admin_roles (
        profile_id uuid not null references %I.profiles(id) on delete cascade,
        scope text not null check (scope in ('vutrudodac', 'phienchotrenmay', 'global')),
        created_at timestamptz not null default now(),
        primary key (profile_id, scope)
      )
    $sql$, schema_name, schema_name);

    execute format($sql$
      create table if not exists %I.admin_actions (
        id uuid primary key default gen_random_uuid(),
        actor_profile_id uuid not null references %I.profiles(id) on delete restrict,
        scope text not null check (scope in ('vutrudodac', 'phienchotrenmay', 'global')),
        action text not null,
        target_type text not null,
        target_id uuid,
        payload jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now()
      )
    $sql$, schema_name, schema_name);

    execute format('create index if not exists %I on %I.lost_items (owner_profile_id, status, created_at desc)', schema_name || '_lost_owner_status_idx', schema_name);
    execute format('create index if not exists %I on %I.found_items (owner_profile_id, status, created_at desc)', schema_name || '_found_owner_status_idx', schema_name);
    execute format('create index if not exists %I on %I.marketplace_listings (status, created_at desc)', schema_name || '_listing_status_idx', schema_name);
    execute format('create index if not exists %I on %I.notifications (recipient_profile_id, read_at, created_at desc)', schema_name || '_notification_recipient_idx', schema_name);
    execute format('create index if not exists %I on %I.admin_actions (scope, created_at desc)', schema_name || '_admin_actions_scope_idx', schema_name);

    execute format('alter table %I.profiles enable row level security', schema_name);
    execute format('alter table %I.lost_items enable row level security', schema_name);
    execute format('alter table %I.found_items enable row level security', schema_name);
    execute format('alter table %I.match_candidates enable row level security', schema_name);
    execute format('alter table %I.marketplace_listings enable row level security', schema_name);
    execute format('alter table %I.marketplace_interests enable row level security', schema_name);
    execute format('alter table %I.notifications enable row level security', schema_name);
    execute format('alter table %I.admin_roles enable row level security', schema_name);
    execute format('alter table %I.admin_actions enable row level security', schema_name);

    execute format('drop policy if exists profiles_self_read on %I.profiles', schema_name);
    execute format('create policy profiles_self_read on %I.profiles for select using (auth.uid() = id)', schema_name);
    execute format('drop policy if exists profiles_self_upsert on %I.profiles', schema_name);
    execute format('create policy profiles_self_upsert on %I.profiles for all using (auth.uid() = id) with check (auth.uid() = id)', schema_name);

    execute format('drop policy if exists lost_items_owner_access on %I.lost_items', schema_name);
    execute format('create policy lost_items_owner_access on %I.lost_items for all using (auth.uid() = owner_profile_id) with check (auth.uid() = owner_profile_id)', schema_name);
    execute format('drop policy if exists found_items_owner_access on %I.found_items', schema_name);
    execute format('create policy found_items_owner_access on %I.found_items for all using (auth.uid() = owner_profile_id) with check (auth.uid() = owner_profile_id)', schema_name);

    execute format('drop policy if exists marketplace_public_approved on %I.marketplace_listings', schema_name);
    execute format('create policy marketplace_public_approved on %I.marketplace_listings for select using (status = ''approved'' or auth.uid() = owner_profile_id)', schema_name);
    execute format('drop policy if exists marketplace_owner_insert on %I.marketplace_listings', schema_name);
    execute format('create policy marketplace_owner_insert on %I.marketplace_listings for insert with check (auth.uid() = owner_profile_id)', schema_name);

    execute format('drop policy if exists marketplace_interests_self on %I.marketplace_interests', schema_name);
    execute format('create policy marketplace_interests_self on %I.marketplace_interests for all using (auth.uid() = profile_id) with check (auth.uid() = profile_id)', schema_name);

    execute format('drop policy if exists notifications_recipient_only on %I.notifications', schema_name);
    execute format('create policy notifications_recipient_only on %I.notifications for select using (auth.uid() = recipient_profile_id)', schema_name);
    execute format('drop policy if exists notifications_recipient_update on %I.notifications', schema_name);
    execute format('create policy notifications_recipient_update on %I.notifications for update using (auth.uid() = recipient_profile_id) with check (auth.uid() = recipient_profile_id)', schema_name);

    execute format('drop policy if exists admin_roles_self_read on %I.admin_roles', schema_name);
    execute format('create policy admin_roles_self_read on %I.admin_roles for select using (auth.uid() = profile_id)', schema_name);
  end loop;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('artemis-report-images', 'artemis-report-images', false, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('artemis-marketplace-images', 'artemis-marketplace-images', false, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('artemis_preview-report-images', 'artemis_preview-report-images', false, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('artemis_preview-marketplace-images', 'artemis_preview-marketplace-images', false, 2097152, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists artemis_storage_owner_read on storage.objects;
create policy artemis_storage_owner_read on storage.objects
for select
using (
  bucket_id in (
    'artemis-report-images',
    'artemis-marketplace-images',
    'artemis_preview-report-images',
    'artemis_preview-marketplace-images'
  )
  and auth.uid()::text = split_part(name, '/', 1)
);

drop policy if exists artemis_storage_owner_write on storage.objects;
create policy artemis_storage_owner_write on storage.objects
for insert
with check (
  bucket_id in (
    'artemis-report-images',
    'artemis-marketplace-images',
    'artemis_preview-report-images',
    'artemis_preview-marketplace-images'
  )
  and auth.uid()::text = split_part(name, '/', 1)
);
