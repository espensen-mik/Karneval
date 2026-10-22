-- A stable answer identity survives editorial changes to the quote text.
alter table public.quotes add column survey_answer_key text;
alter table public.quotes add constraint quotes_survey_answer_key_format check (
  survey_answer_key is null or survey_answer_key ~ '^[0-9a-fA-F-]{36}:(invitation|carnival_is|words|difference|traditions|memory|community):[0-9]{1,2}$'
);
create unique index quotes_survey_answer_key_unique on public.quotes (survey_answer_key) where survey_answer_key is not null;

-- Link existing, unambiguously matching imports without modifying their content.
with candidates as (
  select q.id, r.id::text || ':' || a.key || ':' || (v.ordinality - 1)::text as origin
  from public.quotes q
  join public.survey_responses r on q.person_name = r.first_name || ' (' || r.age::text || ')'
  cross join lateral jsonb_each(r.answers) a
  cross join lateral jsonb_array_elements_text(case when jsonb_typeof(a.value) = 'array' then a.value else '[]'::jsonb end) with ordinality v(value, ordinality)
  where q.quote_source = 'Sjælen af Karneval 2026'
    and a.key in ('invitation','carnival_is','words','difference','traditions','memory','community')
    and v.ordinality <= 100
    and btrim(q.quote_text) = case when a.key = 'carnival_is' and btrim(v.value) !~* '^aalborg karneval er\M' then 'Aalborg Karneval er… ' || btrim(v.value) else btrim(v.value) end
), unique_matches as (
  select *, count(*) over (partition by id) as quote_matches, count(*) over (partition by origin) as origin_matches from candidates
)
update public.quotes q set survey_answer_key = m.origin from unique_matches m
where q.id = m.id and m.quote_matches = 1 and m.origin_matches = 1;
