import test from 'node:test';
import assert from 'node:assert/strict';
import { workshopMutation, workshopGroup, workshopId, WORKSHOP_PAGES } from '../lib/workshop.ts';
const id='29f3012d-808a-4bce-8664-bd96b3cb1559';
const heading='29f3012d-808a-4bce-8664-bd96b3cb1560';
const updated_at='2026-10-23T08:00:00.000Z';
test('three workshop pages and groups exist without fabricated material',()=>{
 assert.equal(WORKSHOP_PAGES.length,3);
 for(const group of [1,2,3])assert.equal(workshopGroup(group),group);
 for(const group of [0,4,'1',null])assert.throws(()=>workshopGroup(group));
});
test('statement identity and original heading survive idempotent retries',()=>{
 const body={resource:'statements',id,heading_id:heading,text:'  Plads til alle  ',group_number:99,closed:true};
 assert.deepEqual(workshopMutation(body,'POST').data,{id,heading_id:heading,text:'Plads til alle'});
 assert.deepEqual(workshopMutation(body,'POST'),workshopMutation(body,'POST'));
 assert.throws(()=>workshopMutation({...body,text:''},'POST'));
 assert.throws(()=>workshopMutation({...body,heading_id:'*'},'POST'));
});
test('heading transitions require an explicit boolean and a known version',()=>{
 assert.deepEqual(workshopMutation({resource:'headings',id,closed:true,updated_at},'PATCH').data,{id,closed:true});
 assert.throws(()=>workshopMutation({resource:'headings',id,closed:'true',updated_at},'PATCH'));
 assert.throws(()=>workshopMutation({resource:'headings',id,closed:true},'PATCH'));
 assert.deepEqual(workshopMutation({resource:'headings',id,group_number:2,title:'  Sammen  '},'POST').data,{id,group_number:2,title:'Sammen'});
});
test('named stories and group summaries validate independently and ignore injected fields',()=>{
 assert.deepEqual(workshopMutation({resource:'stories',id,name:' Anna ',text:' En oplevelse ',email:'private@example.org'},'POST').data,{id,name:'Anna',text:'En oplevelse'});
 assert.deepEqual(workshopMutation({resource:'summaries',group_number:3,text:'Gruppens ord',updated_at},'PATCH').data,{group_number:3,text:'Gruppens ord'});
 assert.throws(()=>workshopMutation({resource:'summaries',group_number:4,text:'Ord'},'POST'));
 assert.throws(()=>workshopMutation({resource:'stories',id,name:'',text:'Ord'},'POST'));
 assert.throws(()=>workshopMutation({resource:'quotes',id,text:'Ord'},'POST'));
 assert.throws(()=>workshopId('*'));
});
