-- Response content is separate from names and email addresses.
create table public.survey_responses (
  id uuid primary key,
  created_at timestamptz not null default now(),
  questionnaire_version integer not null default 1,
  first_name text not null check (length(first_name) between 1 and 160),
  age integer not null check (age between 0 and 120),
  postal_code text not null check (postal_code ~ '^[0-9]{4}$'),
  participations integer not null check (participations between 0 and 300),
  answers jsonb not null check (jsonb_typeof(answers) = 'object' and octet_length(answers::text) <= 60000),
  publication_permission boolean not null,
  contact_permission boolean not null
);
create index survey_responses_created_idx on public.survey_responses (created_at desc, id);
create table public.survey_contacts (
  response_id uuid primary key references public.survey_responses(id) on delete cascade,
  full_name text not null check (length(full_name) between 1 and 160),
  email text not null check (length(email) between 3 and 254)
);
create table public.research_request_limits (
  key_hash text primary key,
  window_start timestamptz not null,
  attempts integer not null
);
alter table public.survey_responses enable row level security;
alter table public.survey_contacts enable row level security;
alter table public.research_request_limits enable row level security;
revoke all on public.survey_responses, public.survey_contacts, public.research_request_limits from public, anon, authenticated;
grant select, insert, update, delete on public.survey_responses, public.survey_contacts, public.research_request_limits to service_role;

-- Only the server can call these functions. Invoker rights preserve table grants.
create function public.submit_digital_soul(p_response jsonb, p_name text, p_email text)
returns void language plpgsql security invoker set search_path = '' as $$
declare inserted_id uuid;
begin
  insert into public.survey_responses (id, questionnaire_version, first_name, age, postal_code, participations, answers, publication_permission, contact_permission)
  values ((p_response->>'id')::uuid, (p_response->>'questionnaire_version')::integer, p_response->>'first_name', (p_response->>'age')::integer,
    p_response->>'postal_code', (p_response->>'participations')::integer, p_response->'answers', (p_response->>'publication_permission')::boolean, (p_response->>'contact_permission')::boolean)
  on conflict (id) do nothing returning id into inserted_id;
  if inserted_id is not null then
    insert into public.survey_contacts (response_id, full_name, email) values (inserted_id, p_name, p_email);
  end if;
end;
$$;
revoke all on function public.submit_digital_soul(jsonb,text,text) from public, anon, authenticated;
grant execute on function public.submit_digital_soul(jsonb,text,text) to service_role;

create function public.research_request_limit(p_key text, p_seconds integer, p_max integer)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare count_now integer;
begin
  if p_seconds not between 1 and 86400 or p_max not between 1 and 1000 or length(p_key) <> 64 then
    raise exception 'Invalid rate limit';
  end if;
  delete from public.research_request_limits where window_start < now() - interval '2 days';
  insert into public.research_request_limits as limits (key_hash, window_start, attempts) values (p_key, now(), 1)
  on conflict (key_hash) do update set
    attempts = case when limits.window_start < now() - make_interval(secs => p_seconds) then 1 else least(limits.attempts + 1, p_max + 1) end,
    window_start = case when limits.window_start < now() - make_interval(secs => p_seconds) then now() else limits.window_start end
  returning attempts into count_now;
  return count_now <= p_max;
end;
$$;
revoke all on function public.research_request_limit(text,integer,integer) from public, anon, authenticated;
grant execute on function public.research_request_limit(text,integer,integer) to service_role;
