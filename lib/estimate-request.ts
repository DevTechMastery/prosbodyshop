import {MAX_PHOTOS,MAX_PHOTO_BYTES,MAX_PHOTOS_BYTES,MAX_REQUEST_BYTES,imageType} from './photos';
export class EstimateInputError extends Error{constructor(message:string,public status=400){super(message)}}
export type PhotoAttachment={filename:string;content:Buffer;contentType:string};
export async function parseEstimateRequest(request:Request):Promise<{body:unknown;attachments:PhotoAttachment[]}>{
 const type=request.headers.get('content-type')??'';const multipart=type.startsWith('multipart/form-data');
 if(!multipart&&!type.includes('application/json'))throw new EstimateInputError('Expected form data.',415);
 const limit=multipart?MAX_REQUEST_BYTES:16000;
 if(Number(request.headers.get('content-length'))>limit)throw new EstimateInputError('Request is too large. Please remove a photo and try again.',413);
 const reader=request.body?.getReader();if(!reader)throw new EstimateInputError('Empty request.');
 const chunks:ArrayBuffer[]=[];let bytes=0;
 try{while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>limit){await reader.cancel();throw new EstimateInputError('Request is too large. Please remove a photo and try again.',413)}chunks.push(part.value.slice().buffer)}}finally{reader.releaseLock()}
 const blob=new Blob(chunks);
 if(!multipart){try{return {body:JSON.parse(await blob.text()),attachments:[]}}catch{throw new EstimateInputError('Invalid request.')}}
 let data:FormData;
 try{data=await new Request(request.url,{method:'POST',headers:{'content-type':type},body:blob}).formData()}catch{throw new EstimateInputError('Could not read the uploaded photos. Please try again.')}
 const uploads=data.getAll('photos');if(uploads.length>MAX_PHOTOS)throw new EstimateInputError('Attach no more than 10 photos.');
 const attachments:PhotoAttachment[]=[];let total=0;
 for(const [index,file] of uploads.entries()){
  if(typeof file==='string'||!file.size)throw new EstimateInputError('One of the photos is empty or invalid.');
  total+=file.size;
  if(file.size>MAX_PHOTO_BYTES||total>MAX_PHOTOS_BYTES)throw new EstimateInputError('Photos are too large. Add them through the photo picker to resize them.',413);
  const content=Buffer.from(await file.arrayBuffer());const detected=imageType(content);
  if(!detected||file.type!==detected)throw new EstimateInputError('Only valid JPG, PNG and WebP photos can be attached.');
  const extension=detected==='image/jpeg'?'jpg':detected==='image/png'?'png':'webp';
  attachments.push({filename:`damage-photo-${String(index+1).padStart(2,'0')}.${extension}`,content,contentType:detected});
 }
 const body:Record<string,string>={};
 for(const [key,value] of data.entries())if(key!=='photos'){if(typeof value!=='string')throw new EstimateInputError('Invalid form field.');body[key]=value}
 return {body,attachments};
}
