import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server';
import {POST} from '../app/api/estimate/route';
import {GET} from '../app/api/vehicles/route';
import {escapeHtml} from '../lib/estimate';
const valid={name:'Test Customer',phone:'6265550100',email:'qa@example.com',year:2021,make:'Toyota',model:'Camry',damage:'Front Bumper',description:'Test only: scratched front bumper.',website:''};
const request=(data:unknown,headers:Record<string,string>={})=>new NextRequest('https://concept.example/api/estimate',{method:'POST',headers:{'content-type':'application/json',origin:'https://concept.example',...headers},body:JSON.stringify(data)});
test('estimate and vehicle routes: validation, truthful delivery and upstream failures',async()=>{
 const oldEnv={...process.env};const oldFetch=global.fetch;const oldInfo=console.info;const oldError=console.error;
 try{
 delete process.env.RESEND_API_KEY;delete process.env.FROM_EMAIL;Object.assign(process.env,{NODE_ENV:'production',ESTIMATE_DEMO_MODE:'false'});
 assert.equal((await POST(request(valid))).status,503);
 assert.equal((await POST(request({...valid,email:'invalid'}))).status,400);
 assert.equal((await POST(request({...valid,make:'Toyota\nInjected header'}))).status,400);
 assert.equal((await POST(request({...valid,website:'spam'}))).status,400);
 assert.equal((await POST(request(valid,{origin:'https://other.example'}))).status,403);
 assert.equal((await POST(request({...valid,description:'a'.repeat(17000)}))).status,413);
 Object.assign(process.env,{NODE_ENV:'development'});console.info=()=>{};
 const demo=await POST(request(valid));assert.equal(demo.status,202);assert.equal((await demo.json()).delivered,false);
 Object.assign(process.env,{NODE_ENV:'production',RESEND_API_KEY:'re_test_fixture',FROM_EMAIL:'Concept <test@example.com>',ESTIMATE_EMAIL:'qa-inbox@example.com'});
 let providerBody:Record<string,unknown>={};
 global.fetch=async(_input,init)=>{providerBody=JSON.parse(String(init?.body));return Response.json({id:'mock-only-no-email-sent'})};
 const sent=await POST(request({...valid,name:'<script>alert(1)</script>'}));assert.equal(sent.status,200);assert.equal((await sent.json()).delivered,true);assert.equal(providerBody.reply_to,'qa@example.com');assert.equal(providerBody.to,'qa-inbox@example.com');assert.ok(String(providerBody.html).includes('&lt;script&gt;'));assert.ok(!String(providerBody.html).includes('<script>'));assert.equal(providerBody.subject,'New Estimate Request — 2021 Toyota Camry — Front Bumper');
 const withPhotos=new FormData();for(const [key,value] of Object.entries(valid))withPhotos.set(key,String(value));withPhotos.append('photos',new File([new Uint8Array([255,216,255,224])],'bumper.jpg',{type:'image/jpeg'}));
 const photoResponse=await POST(new NextRequest('https://concept.example/api/estimate',{method:'POST',headers:{origin:'https://concept.example'},body:withPhotos}));assert.equal(photoResponse.status,200);const attached=providerBody.attachments as {filename:string;content:string}[];assert.equal(attached.length,1);assert.equal(attached[0].filename,'damage-photo-01.jpg');assert.equal(attached[0].content,Buffer.from([255,216,255,224]).toString('base64'));
 console.error=()=>{};global.fetch=async()=>Response.json({name:'validation_error',message:'Mock rejection'},{status:422});assert.equal((await POST(request(valid))).status,502);
 global.fetch=async()=>{throw new Error('Mock offline')};assert.equal((await POST(request(valid))).status,502);
 assert.equal((await GET(new NextRequest('https://concept.example/api/vehicles?year=bad'))).status,400);
 assert.equal((await GET(new NextRequest('https://concept.example/api/vehicles?year=2021'))).status,502);
 let lookup='';global.fetch=async(input)=>{lookup=String(input);return Response.json({Results:[{Model_ID:2,Model_Name:'Camry'},{Model_ID:3,Model_Name:'Camry'},{Model_ID:1,Model_Name:'Avalon'}]})};
 const models=await GET(new NextRequest('https://concept.example/api/vehicles?year=2021&make=448'));assert.equal(models.status,200);assert.equal((await models.json()).options.length,2);assert.ok(lookup.includes('makeId/448/modelyear/2021'));
 assert.equal(escapeHtml('"<&>'),'&quot;&lt;&amp;&gt;');
 }finally{global.fetch=oldFetch;console.info=oldInfo;console.error=oldError;for(const key of Object.keys(process.env))if(!(key in oldEnv))delete process.env[key];Object.assign(process.env,oldEnv)}
});
