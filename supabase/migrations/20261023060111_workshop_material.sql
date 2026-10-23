create table public.workshop_headings (
 id uuid primary key default gen_random_uuid(),
 group_number smallint not null check (group_number between 1 and 3),
 title text not null check (length(btrim(title)) between 1 and 200),
 closed boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index workshop_headings_group_idx on public.workshop_headings(group_number,created_at,id);
create table public.workshop_statements (
 id uuid primary key default gen_random_uuid(),
 heading_id uuid not null references public.workshop_headings(id) on delete restrict,
 text text not null check (length(btrim(text)) between 1 and 3000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index workshop_statements_heading_idx on public.workshop_statements(heading_id,created_at desc,id);
create table public.workshop_stories (
 id uuid primary key default gen_random_uuid(),
 name text not null check (length(btrim(name)) between 1 and 160),
 text text not null check (length(btrim(text)) between 1 and 12000),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index workshop_stories_created_idx on public.workshop_stories(created_at desc,id);
create table public.workshop_summaries (
 group_number smallint primary key check (group_number between 1 and 3),
 text text not null check (length(btrim(text)) between 1 and 12000),
 updated_at timestamptz not null default now()
);

alter table public.workshop_headings enable row level security;
alter table public.workshop_statements enable row level security;
alter table public.workshop_stories enable row level security;
alter table public.workshop_summaries enable row level security;
revoke all on public.workshop_headings,public.workshop_statements,public.workshop_stories,public.workshop_summaries from public,anon,authenticated;
grant select,insert,update on public.workshop_headings,public.workshop_statements,public.workshop_stories,public.workshop_summaries to service_role;

-- Serialise submission against closing a heading; retrying the same ID is safe.
create function public.add_workshop_statement(p_id uuid,p_heading uuid,p_text text)
returns public.workshop_statements language plpgsql security invoker set search_path = '' as $$
declare saved public.workshop_statements; is_closed boolean;
begin
 select * into saved from public.workshop_statements where id=p_id;
 if found then
   if saved.heading_id<>p_heading or saved.text<>btrim(p_text) then raise exception 'ID already used'; end if;
   return saved;
 end if;
 select closed into is_closed from public.workshop_headings where id=p_heading for update;
 if not found or is_closed then raise exception 'Overskriften er lukket eller findes ikke.' using errcode='22023'; end if;
 insert into public.workshop_statements(id,heading_id,text) values(p_id,p_heading,btrim(p_text)) on conflict(id) do nothing;
 select * into saved from public.workshop_statements where id=p_id;
 if saved.heading_id<>p_heading or saved.text<>btrim(p_text) then raise exception 'ID already used'; end if;
 return saved;
end $$;
revoke all on function public.add_workshop_statement(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.add_workshop_statement(uuid,uuid,text) to service_role;
