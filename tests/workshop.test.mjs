import test from 'node:test';
import assert from 'node:assert/strict';
import { WORKSHOP_PAGES, workshopGroups, readWorkshopArchive } from '../lib/workshop.ts';
const archive={headings:[{id:'a',group_number:1,title:'Fællesskab'},{id:'b',group_number:2,title:'Frihed'},{id:'c',group_number:3,title:'Farver'}],statements:[{id:'1',heading_id:'a',text:'Plads til alle'},{id:'2',heading_id:'a',text:'Plads til alle'},{id:'3',heading_id:'b',text:'Venner'},{id:'4',heading_id:'c',text:'Kostumer'}],stories:[{id:'s',name:'Navn',text:'Original historie'}],summaries:[{group_number:1,text:'Gruppens egne ord'}]};
test('archive keeps all three groups, original headings and repeated independent statements',()=>{
 assert.equal(WORKSHOP_PAGES.length,3);
 const groups=workshopGroups(archive);
 assert.deepEqual(groups.map(g=>g.number),[1,2,3]);
 assert.deepEqual(groups.map(g=>g.totalStatements),[2,1,1]);
 assert.equal(groups.flatMap(g=>g.headings.flatMap(h=>h.statements)).length,4);
 assert.deepEqual(groups[0].headings[0].statements,archive.statements.slice(0,2));
});
test('search narrows only the view and retains original group totals and untouched material',()=>{
 const before=JSON.stringify(archive);
 assert.equal(workshopGroups(archive,'plads')[0].matchedStatements,2);
 assert.equal(workshopGroups(archive,'FÆLLESSKAB')[0].matchedStatements,2);
 const filtered=workshopGroups(archive,'venner');
 assert.equal(filtered[0].headings.length,0);assert.equal(filtered[0].totalStatements,2);
 assert.equal(filtered[1].matchedStatements,1);assert.equal(JSON.stringify(archive),before);
});
test('reader retrieves every page for every resource even under a lower server page cap',async()=>{
 const sizes={workshop_headings:7,workshop_statements:1203,workshop_stories:15,workshop_summaries:3};
 const result=await readWorkshopArchive(async path=>{
  const url=new URL(path,'https://example.test/');const table=url.pathname.slice(1),offset=Number(url.searchParams.get('offset'));
  return Response.json(Array.from({length:Math.min(100,sizes[table]-offset)},(_,i)=>({id:offset+i})),{headers:{'content-range':`*/${sizes[table]}`}});
 });
 assert.equal(result.statements.length,1203);assert.equal(result.headings.length,7);assert.equal(result.stories.length,15);assert.equal(result.summaries.length,3);
});
test('incomplete reads fail explicitly instead of presenting a partial archive',async()=>{
 await assert.rejects(readWorkshopArchive(async()=>Response.json([],{headers:{'content-range':'*/100'}})));
 assert.deepEqual(workshopGroups({headings:[],statements:[],stories:[],summaries:[]}).map(g=>g.totalStatements),[0,0,0]);
});
