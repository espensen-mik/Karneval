import test from 'node:test';
import assert from 'node:assert/strict';
import { readSearchMaterial, searchDocuments, searchMaterial, frequentWords, SEARCH_TABLES } from '../lib/soul-search.ts';

const tables = {
 quotes: [{id:'q1', quote_text:'Nye venner. Nye møder!',person_name:'Citatnavn',quote_source:'Avisen'}],
 survey_responses: [{id:'r1',first_name:'Anna',age:25,email:'never@example.test',answers:{memory:['Mødte en ven i regnen'],carnival_is:['Aalborg Karneval er… nye venner',''],traditions:['Nej'],unknown:['hemmeligt']}}],
 workshop_headings:[{id:'h1',group_number:3,title:'Fællesskab'}],
 workshop_statements:[{id:'s1',heading_id:'h1',text:'Nye møder'}],
 workshop_stories:[{id:'st1',name:'Historiefortæller',text:'En ny oplevelse'}],
 workshop_summaries:[{group_number:2,text:'Frihed og fællesskab'}],
 sources:[{id:'k1',title:'Karnevallets historie',creator:'Forfatteren',file_name:'historie.pdf'}],
};
test('search spans every content type, keeps individual answers, and excludes email and unknown fields',()=>{
 const docs=searchDocuments(tables);
 assert.equal(docs.length,9);
 assert.equal(searchMaterial(docs,'NYE').total,3);
 assert.equal(searchMaterial(docs,'nye','survey').total,1);
 assert.equal(searchMaterial(docs,'forfatteren').results[0].source,'source');
 assert.equal(searchMaterial(docs,'hemmeligt').total,0);
 assert.equal(JSON.stringify(docs).includes('never@example.test'),false);
 assert.equal(searchMaterial(docs,'nye venner').total,2);
 assert.equal(searchMaterial(docs,'Aalborg Karneval er').results.some(r=>r.id==='survey:r1:carnival_is:0'),true);
 assert.equal(searchMaterial(docs,'xyz').total,0);
 assert.equal(searchMaterial(docs,'').total,0);
});
test('original destinations identify workshop group, source, quote and full survey response',()=>{
 const docs=searchDocuments(tables);
 assert.equal(docs.find(d=>d.id==='statement:s1').href,'/sjaelemoede/karneval-er?gruppe=3#workshop-h1');
 assert.equal(docs.find(d=>d.id==='survey:r1:memory:0').href,'/den-digitale-sjael?response=r1');
 assert.equal(docs.find(d=>d.id==='quote:q1').href,'/citater#citat-q1');
 assert.equal(docs.find(d=>d.id==='source:k1').href,'/kilder#source-k1');
});
test('word counts are occurrences, exclude metadata, stopwords, fixed prompt and structured no',()=>{
 const words=frequentWords(searchDocuments(tables));
 assert.deepEqual(words.find(w=>w.word==='nye'),{word:'nye',count:4,texts:3});
 for(const excluded of ['aalborg','karneval','nej','anna','forfatteren','citatnavn','hemmeligt'])assert.equal(words.some(w=>w.word===excluded),false);
 assert.equal(words.find(w=>w.word==='fællesskab').count,1); // summary, not editorial heading
 const short=frequentWords([{wordText:'En ny by og øl'}]);
 assert.deepEqual(new Set(short.map(w=>w.word)),new Set(['ny','by','øl']));
});
test('a match deep inside a long answer appears in excerpt and all pages are reachable',()=>{
 const doc=searchDocuments(tables)[0];
 const documents=Array.from({length:5000},(_,i)=>({...doc,id:String(i).padStart(5,'0'),text:'x '.repeat(1000)+'nyt møde '+'y '.repeat(1000)}));
 const found=searchMaterial(documents,'nyt møde','',249);
 assert.equal(found.total,5000);assert.equal(found.pages,250);assert.equal(found.results.length,20);
 assert.ok(found.results.every(r=>r.excerpt.includes('nyt møde')&&r.excerpt.length<=322));
 assert.equal(searchMaterial(documents,'nyt', '',999).page,249);
});
test('all REST pages are read even with server caps, and missing pages fail explicitly',async()=>{
 const paths=[];
 const docs=await readSearchMaterial(async path=>{
  paths.push(path); const url=new URL(path,'https://test.invalid');const table=url.pathname.slice(1);
  const rows=table==='quotes'?Array.from({length:1203},(_,i)=>({id:String(i),quote_text:'Fest'})):[];
  const offset=Number(url.searchParams.get('offset'));
  assert.equal(url.searchParams.get('select'),SEARCH_TABLES[table]);
  return Response.json(rows.slice(offset,offset+100),{headers:{'content-range':`*/${rows.length}`}});
 });
 assert.equal(docs.length,1203);assert.equal(paths.filter(p=>p.startsWith('quotes?')).length,13);
 await assert.rejects(readSearchMaterial(async()=>Response.json([],{headers:{'content-range':'*/1'}})));
 await assert.rejects(readSearchMaterial(async()=>Response.json([])));
});
