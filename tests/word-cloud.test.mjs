import test from 'node:test';
import assert from 'node:assert/strict';
import {cloudIndex,cloudSlice,cloudGroups,findCloudTerms} from '../lib/word-cloud.ts';
const c=(id,text,type='quote',category='Generel')=>({id,text,type,category,source:null,contextHref:'/citater'});
const options={focus:[],hidden:[],source:'all',category:'',minimum:1,kind:'word',limit:60,nuances:false};
const input=[c('a','Fest og frihed. Fest.'),c('b','Fest og venner.'),c('c','Frihed og farver.','survey','Svar'),c('d','Trommer og dans.','survey','Svar')];
test('drilling into multiple words uses intersection within an independent contribution',()=>{
 const index=cloudIndex(input);
 const one=cloudSlice(index,{...options,focus:['fest']});
 assert.equal(one.contributions.length,2);assert.equal(one.all.find(t=>t.id==='frihed').count,1);
 const two=cloudSlice(index,{...options,focus:['fest','frihed']});
 assert.deepEqual(two.contributions.map(c=>c.id),['a']);
 assert.equal(two.terms.find(t=>t.id==='fest').count,1);
 assert.ok(!two.terms.some(t=>t.id==='venner'));
 assert.equal(cloudSlice(index,{...options,focus:['fest','dans']}).contributions.length,0);
});
test('hidden dominant terms reveal other words without changing corpus or evidence',()=>{
 const index=cloudIndex(input);
 const slice=cloudSlice(index,{...options,hidden:['fest'],limit:2});
 assert.equal(slice.contributions.length,4);assert.equal(slice.terms.length,2);
 assert.ok(!slice.terms.some(t=>t.id==='fest'));
 assert.ok(slice.all.some(t=>t.id==='fest'));
 assert.equal(findCloudTerms(slice.all,'FEST')[0].count,2);
});
test('source/category filters, rare words and enrichment use their own honest denominators',()=>{
 const index=cloudIndex(input);
 const filtered=cloudSlice(index,{...options,source:'survey',category:'Svar'});
 assert.equal(filtered.baseCount,2);assert.equal(filtered.contributions.length,2);
 const focused=cloudSlice(index,{...options,focus:['fest'],nuances:true});
 assert.equal(focused.terms.find(t=>t.id==='venner').specificity,2);
 const rare=cloudSlice(index,{...options,nuances:true,limit:1});assert.equal(rare.terms[0].count,1);
});
test('connections and groups are deterministic and cannot bridge disconnected evidence',()=>{
 const slice=cloudSlice(cloudIndex(input),options);
 const groups=cloudGroups(slice.terms,slice.edges);
 assert.deepEqual([...groups.membership], [...cloudGroups([...slice.terms].reverse(),slice.edges).membership]);
 assert.equal(groups.membership.get('trommer'),groups.membership.get('dans'));
 assert.notEqual(groups.membership.get('trommer'),groups.membership.get('fest'));
 assert.ok(!slice.edges.some(e=>[e.source,e.target].includes('fest')&&[e.source,e.target].includes('dans')));
 assert.deepEqual(cloudGroups([],[]).groups,[]);
});
test('phrases are backed by actual repeated sequences and focus terms remain visible',()=>{
 const index=cloudIndex([c('a','God stemning og frihed'),c('b','God stemning og venner')]);
 const slice=cloudSlice(index,{...options,focus:['god stemning'],kind:'word',minimum:5,limit:1});
 assert.equal(slice.contributions.length,2);
 assert.ok(slice.terms.some(t=>t.id==='god stemning'));
 assert.equal(slice.eligibleCount,1);
 assert.ok(!index.byId.has('frihed venner'));
});
