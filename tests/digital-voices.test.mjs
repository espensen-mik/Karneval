import test from 'node:test';
import assert from 'node:assert/strict';
import { voiceTarget, voiceSelection, voiceThemeName, voiceQuery, voiceContextHref } from '../lib/digital-voices.ts';
const id='00000000-0000-4000-8000-000000000001';
const theme='00000000-0000-4000-8000-000000000002';
const target={response_id:id,question_id:'difference',answer_index:0};
test('selection identifies the original field and ignores replacement content',()=>{
 assert.deepEqual(voiceSelection({...target,text:'Injected replacement',first_name:'Injected name',theme_ids:[theme,theme]}),{p_response:id,p_question:'difference',p_answer:0,p_themes:[theme]});
 assert.deepEqual(voiceSelection({...target,theme_ids:[]}).p_themes,[]);
});
test('rejects invalid response identities, questions, field indices and theme lists',()=>{
 for(const invalid of [{...target,response_id:'bad'},{...target,question_id:'email'},{...target,answer_index:-1},{...target,answer_index:100},{...target,answer_index:0.5}]) assert.throws(()=>voiceTarget(invalid));
 for(const ids of [null,['bad'],Array(21).fill(theme)]) assert.throws(()=>voiceSelection({...target,theme_ids:ids}));
});
test('theme names are normalized and cannot be empty or oversized',()=>{
 assert.equal(voiceThemeName('  Frihed   og leg '),'Frihed og leg');
 assert.throws(()=>voiceThemeName(' ')); assert.throws(()=>voiceThemeName('a'.repeat(81)));
});
test('source and theme filters remain typed and search is bounded',()=>{
 assert.deepEqual(voiceQuery(new URLSearchParams({response:id,question:'difference',answer:'0',theme,q:'fest',page:'2'})),{p_response:id,p_question:'difference',p_answer:0,p_theme:theme,p_query:'fest',p_page:2});
 assert.throws(()=>voiceQuery(new URLSearchParams('theme=bad')));
 assert.throws(()=>voiceQuery(new URLSearchParams({response:id,question:'email',answer:'0'})));
 assert.equal(voiceQuery(new URLSearchParams('q='+ 'a'.repeat(200))).p_query.length,100);
 assert.equal(voiceQuery(new URLSearchParams('page=-1')).p_page,0);
 assert.equal(new URL(voiceContextHref(id),'https://example.test').searchParams.get('response'),id);
});
