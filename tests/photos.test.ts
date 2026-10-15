import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseEstimateRequest,EstimateInputError} from '../lib/estimate-request';
import {MAX_PHOTO_BYTES,MAX_REQUEST_BYTES} from '../lib/photos';
const jpeg=new Uint8Array([255,216,255,224,0,16,74,70,73,70]);
function request(count=1,bytes:Uint8Array=jpeg,type='image/jpeg'){
 const form=new FormData();form.set('name','Photo Customer');
 for(let i=0;i<count;i++)form.append('photos',new File([bytes.slice().buffer],'../../unsafe-name.jpg',{type}));
 return new Request('https://concept.example/api/estimate',{method:'POST',body:form});
}
test('multipart accepts 0–10 photos and generates safe attachment names',async()=>{
 assert.equal((await parseEstimateRequest(request(0))).attachments.length,0);
 const result=await parseEstimateRequest(request(10));assert.equal(result.attachments.length,10);assert.equal((result.body as {name:string}).name,'Photo Customer');assert.equal(result.attachments[0].filename,'damage-photo-01.jpg');assert.deepEqual(result.attachments[0].content,Buffer.from(jpeg));
});
test('rejects extra, oversized, spoofed or empty attachments',async()=>{
 for(const req of [request(11),request(1,new Uint8Array(MAX_PHOTO_BYTES+1)),request(1,jpeg,'image/png'),request(1,new TextEncoder().encode('<svg>unsafe</svg>')),request(1,new Uint8Array())])await assert.rejects(()=>parseEstimateRequest(req),EstimateInputError);
});
test('bounds the request stream even without content-length',async()=>{
 const body=new ReadableStream<Uint8Array>({start(controller){controller.enqueue(new Uint8Array(MAX_REQUEST_BYTES+1));controller.close()}});
 const req=new Request('https://concept.example/api/estimate',{method:'POST',headers:{'content-type':'multipart/form-data; boundary=test'},body,duplex:'half'} as RequestInit);
 await assert.rejects(()=>parseEstimateRequest(req),(e:unknown)=>e instanceof EstimateInputError&&e.status===413);
});
