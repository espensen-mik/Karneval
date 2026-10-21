import test from 'node:test';
import assert from 'node:assert/strict';
import { surveyGeography } from '../lib/survey-geography.ts';
import { analyzeSurvey } from '../lib/survey-analysis.ts';
test('postal codes map to documented postal towns and preserve distinct Aalborg areas',()=>{
 const places=surveyGeography([{postal_code:'9000'},{postal_code:'9000'},{postal_code:'9200'},{postal_code:'9400'},{postal_code:'8000'}]);
 assert.equal(places[0].label,'Aalborg'); assert.equal(places[0].count,2);
 assert.equal(places.find(p=>p.label==='Aalborg SV').count,1);
 assert.equal(places.find(p=>p.label==='Nørresundby').count,1);
 assert.equal(places.find(p=>p.label==='Aarhus C').count,1);
 assert.deepEqual(places[0].postalCodes,['9000']);
});
test('unknown, missing and invalid codes remain visible with honest totals',()=>{
 const places=surveyGeography([{postal_code:'0000'},{postal_code:' 9000 '},{postal_code:null},{postal_code:'bad'}]);
 assert.equal(places.reduce((sum,p)=>sum+p.count,0),4);
 assert.ok(places.some(p=>p.label==='Ukendt postnummer · 0000'));
 assert.ok(places.some(p=>p.label==='Ikke oplyst'));
 assert.ok(places.some(p=>p.label==='Ukendt postnummer · bad'));
 assert.deepEqual(surveyGeography([]),[]);
});
test('geography uses all deduplicated responses, independently of sentence-field count',()=>{
 const row={id:'a',age:30,participations:2,postal_code:'9000',carnival_is:['Fest','Frihed','Farver']};
 const result=analyzeSurvey([row,row,{...row,id:'b',carnival_is:[]}]);
 assert.equal(result.total,2); assert.equal(result.places[0].count,2); assert.equal(result.statements,3);
});
