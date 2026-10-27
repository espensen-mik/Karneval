create table public.research_login_events (
 id bigint generated always as identity primary key,
 occurred_at timestamptz not null default now(),
 ip_hash text check (ip_hash is null or ip_hash ~ '^[a-f0-9]{64}$')
);
create index research_login_events_occurred_idx on public.research_login_events (occurred_at);
alter table public.research_login_events enable row level security;
revoke all on public.research_login_events from public, anon, authenticated;
grant select, insert on public.research_login_events to service_role;
grant usage on sequence public.research_login_events_id_seq to service_role;
create function public.research_login_statistics() returns jsonb
language sql stable security invoker set search_path = '' as $$
with bounds as (select (now() at time zone 'Europe/Copenhagen')::date as today),
daily as (
 select (occurred_at at time zone 'Europe/Copenhagen')::date as day, count(*) as logins, count(distinct ip_hash) as unique_ips
 from public.research_login_events, bounds
 where occurred_at >= ((today - 29)::timestamp at time zone 'Europe/Copenhagen')
 group by 1
),
days as (
 select b.today - n as day, coalesce(d.logins,0) as logins, coalesce(d.unique_ips,0) as unique_ips
 from bounds b cross join generate_series(0,29) n left join daily d on d.day=b.today-n
)
select jsonb_build_object(
 'total',count(*),'unique_ips',count(distinct ip_hash),
 'last_30_days',count(*) filter(where occurred_at >= (((select today from bounds)-29)::timestamp at time zone 'Europe/Copenhagen')),
 'unique_30_days',count(distinct ip_hash) filter(where occurred_at >= (((select today from bounds)-29)::timestamp at time zone 'Europe/Copenhagen')),
 'unknown_ips',count(*) filter(where ip_hash is null),'first_login',min(occurred_at),
 'days',(select jsonb_agg(to_jsonb(days) order by day desc) from days)
) from public.research_login_events;
$$;
revoke all on function public.research_login_statistics() from public, anon, authenticated;
grant execute on function public.research_login_statistics() to service_role;
