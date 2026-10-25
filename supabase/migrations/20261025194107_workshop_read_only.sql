-- Workshop transcription is complete. Keep every row and grant read access only.
revoke insert,update,delete on public.workshop_headings,public.workshop_statements,public.workshop_stories,public.workshop_summaries from service_role;
revoke execute on function public.add_workshop_statement(uuid,uuid,text) from service_role;
