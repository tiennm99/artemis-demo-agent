-- Run after the two admin Google accounts have signed in at least once.
-- This clean-start seed intentionally does not import legacy SQLite rows or base64 images.

with admin_users as (
  select id, email
  from auth.users
  where lower(email) in ('minhtienit99@gmail.com', 'minhnguyetawf@gmail.com')
),
upsert_profiles as (
  insert into artemis.profiles (id, email, auth_provider, display_name, domain)
  select
    id,
    lower(email),
    'google',
    split_part(lower(email), '@', 1),
    split_part(lower(email), '@', 1)
  from admin_users
  on conflict (id) do update
  set email = excluded.email,
      display_name = excluded.display_name,
      domain = excluded.domain,
      updated_at = now()
  returning id
),
scopes(scope) as (
  values ('global'), ('vutrudodac'), ('phienchotrenmay')
)
insert into artemis.admin_roles (profile_id, scope)
select id, scope
from upsert_profiles
cross join scopes
on conflict do nothing;

with admin_users as (
  select id, email
  from auth.users
  where lower(email) in ('minhtienit99@gmail.com', 'minhnguyetawf@gmail.com')
),
upsert_profiles as (
  insert into artemis_preview.profiles (id, email, auth_provider, display_name, domain)
  select
    id,
    lower(email),
    'google',
    split_part(lower(email), '@', 1),
    split_part(lower(email), '@', 1)
  from admin_users
  on conflict (id) do update
  set email = excluded.email,
      display_name = excluded.display_name,
      domain = excluded.domain,
      updated_at = now()
  returning id
),
scopes(scope) as (
  values ('global'), ('vutrudodac'), ('phienchotrenmay')
)
insert into artemis_preview.admin_roles (profile_id, scope)
select id, scope
from upsert_profiles
cross join scopes
on conflict do nothing;
