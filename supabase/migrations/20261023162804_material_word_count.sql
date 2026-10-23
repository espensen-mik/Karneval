-- Count only content, never names, question labels, headings or contact details.
-- Each stored contribution counts in full, including repeated words and imports.
create function public.material_word_count()
returns jsonb language sql stable security invoker set search_path = '' as $$
 with texts as (
  select 'quotes' as source, quote_text as text from public.quotes
  union all
  select 'survey',v.text from public.survey_responses r
   cross join lateral jsonb_each(r.answers) a
   cross join lateral jsonb_array_elements_text(case when jsonb_typeof(a.value)='array' then a.value else '[]'::jsonb end) v(text)
   where a.key in ('invitation','carnival_is','words','difference','traditions','memory','community')
  union all select 'workshop',text from public.workshop_statements
  union all select 'workshop',text from public.workshop_stories
  union all select 'workshop',text from public.workshop_summaries
 ), counts as (
  select source,regexp_count(coalesce(text,''),$word$[[:alnum:]]+(?:[’'-][[:alnum:]]+)*$word$) as words from texts
 )
 select jsonb_build_object(
  'total',coalesce(sum(words),0),
  'quotes',coalesce(sum(words) filter(where source='quotes'),0),
  'survey',coalesce(sum(words) filter(where source='survey'),0),
  'workshop',coalesce(sum(words) filter(where source='workshop'),0)
 ) from counts;
$$;
revoke all on function public.material_word_count() from public,anon,authenticated;
grant execute on function public.material_word_count() to service_role;
