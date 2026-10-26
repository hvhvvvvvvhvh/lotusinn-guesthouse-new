-- Run once in this project's Supabase SQL Editor. Existing tables are retained.
begin;

create table if not exists public.lotus_documents (
  key text primary key check (key in ('site','rooms','bookings','messages','expenses','blogs','authors')),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  version bigint not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);

alter table public.lotus_documents enable row level security;
revoke all on public.lotus_documents from anon, authenticated;
grant select, insert, update, delete on public.lotus_documents to service_role;

create or replace function public.lotus_compare_and_set(
  p_key text, p_data jsonb, p_expected_version bigint
) returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  new_version bigint;
begin
  update public.lotus_documents
    set data = p_data, version = version + 1, updated_at = now()
    where key = p_key and version = p_expected_version
    returning version into new_version;
  if not found then
    raise sqlstate 'PT409' using message = 'version_conflict';
  end if;
  return new_version;
end;
$$;

revoke all on function public.lotus_compare_and_set(text,jsonb,bigint) from public, anon, authenticated;
grant execute on function public.lotus_compare_and_set(text,jsonb,bigint) to service_role;
commit;
