create table public.soul_voice_themes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  created_at timestamptz not null default now()
);
create unique index soul_voice_themes_name_idx on public.soul_voice_themes (lower(btrim(name)));
create table public.soul_voices (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.survey_responses(id) on delete cascade,
  question_id text not null check (question_id in ('invitation','carnival_is','words','difference','traditions','memory','community')),
  answer_index integer not null check (answer_index between 0 and 99),
  created_at timestamptz not null default now(),
  unique (response_id, question_id, answer_index)
);
create index soul_voices_created_idx on public.soul_voices (created_at desc, id);
create table public.soul_voice_theme_links (
  voice_id uuid not null references public.soul_voices(id) on delete cascade,
  theme_id uuid not null references public.soul_voice_themes(id) on delete cascade,
  primary key (voice_id,theme_id)
);
create index soul_voice_theme_links_theme_idx on public.soul_voice_theme_links (theme_id,voice_id);
alter table public.soul_voice_themes enable row level security;
alter table public.soul_voices enable row level security;
alter table public.soul_voice_theme_links enable row level security;
revoke all on public.soul_voice_themes, public.soul_voices, public.soul_voice_theme_links from public, anon, authenticated;
grant select,insert,update,delete on public.soul_voice_themes, public.soul_voices, public.soul_voice_theme_links to service_role;

create function public.save_soul_voice(p_response uuid, p_question text, p_answer integer, p_themes uuid[])
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_text text; v_id uuid;
begin
  if p_question is null or p_question not in ('invitation','carnival_is','words','difference','traditions','memory','community') or p_answer is null or p_answer < 0 or p_answer > 99 or p_themes is null or cardinality(p_themes) > 20 then
    raise exception 'Ugyldigt svar eller for mange temaer.' using errcode = '22023';
  end if;
  -- Read the original field; the client cannot submit replacement text or author details.
  select r.answers->p_question->>p_answer into v_text from public.survey_responses r where r.id=p_response for key share;
  if v_text is null or btrim(v_text)='' then raise exception 'Svaret findes ikke længere.' using errcode = '22023'; end if;
  if exists (select 1 from unnest(p_themes) t(id) where id is null or not exists (select 1 from public.soul_voice_themes x where x.id=t.id)) then
    raise exception 'Et tema findes ikke længere.' using errcode = '22023';
  end if;
  if cardinality(p_themes)=0 then
    delete from public.soul_voices where response_id=p_response and question_id=p_question and answer_index=p_answer;
    return jsonb_build_object('saved',false);
  end if;
  insert into public.soul_voices(response_id,question_id,answer_index) values(p_response,p_question,p_answer)
    on conflict (response_id,question_id,answer_index) do update set response_id=excluded.response_id returning id into v_id;
  delete from public.soul_voice_theme_links where voice_id=v_id and not (theme_id=any(p_themes));
  insert into public.soul_voice_theme_links(voice_id,theme_id) select v_id,t.id from (select distinct unnest(p_themes) as id) t on conflict do nothing;
  return jsonb_build_object('saved',true,'id',v_id);
end;
$$;

create function public.read_soul_voices(p_theme uuid default null, p_query text default '', p_page integer default 0, p_response uuid default null, p_question text default null, p_answer integer default null)
returns jsonb language sql stable security invoker set search_path = '' as $$
with voices as materialized (
  select v.id,v.response_id,v.question_id,v.answer_index,v.created_at,r.first_name,r.age,
    r.answers->v.question_id->>v.answer_index as text,
    array(select l.theme_id from public.soul_voice_theme_links l where l.voice_id=v.id order by l.theme_id) as theme_ids
  from public.soul_voices v join public.survey_responses r on r.id=v.response_id
  where nullif(btrim(r.answers->v.question_id->>v.answer_index),'') is not null
), matching as (
  select * from voices v where (p_theme is null or p_theme=any(v.theme_ids))
    and (p_response is null or v.response_id=p_response)
    and (p_question is null or v.question_id=p_question)
    and (p_answer is null or v.answer_index=p_answer)
    and (coalesce(p_query,'')='' or strpos(lower(v.text),lower(left(p_query,100)))>0)
), page as (
  select * from matching order by created_at desc,id limit 24 offset greatest(0,least(coalesce(p_page,0),100000))*24
), themes as (
  select t.id,t.name,(select count(*) from voices v where t.id=any(v.theme_ids)) as count
  from public.soul_voice_themes t order by lower(t.name),t.id
)
select jsonb_build_object('entries',coalesce((select jsonb_agg(p order by p.created_at desc,p.id) from page p),'[]'::jsonb),
  'themes',coalesce((select jsonb_agg(t) from themes t),'[]'::jsonb),
  'total',(select count(*) from voices),'matched',(select count(*) from matching),'page',greatest(0,least(coalesce(p_page,0),100000)));
$$;
revoke all on function public.save_soul_voice(uuid,text,integer,uuid[]), public.read_soul_voices(uuid,text,integer,uuid,text,integer) from public,anon,authenticated;
grant execute on function public.save_soul_voice(uuid,text,integer,uuid[]), public.read_soul_voices(uuid,text,integer,uuid,text,integer) to service_role;
