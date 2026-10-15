import {MAX_PHOTO_BYTES,MAX_SOURCE_BYTES,PHOTO_TYPES} from './photos';
// Re-encoding also removes camera metadata, including location tags.
export async function preparePhoto(source:File):Promise<File>{
 if(source.size>MAX_SOURCE_BYTES)throw new Error(`${source.name}: choose a photo smaller than 20 MB.`);
 if(!PHOTO_TYPES.includes(source.type))throw new Error(`${source.name}: use JPG, PNG or WebP. Export HEIC photos as JPG first.`);
 const url=URL.createObjectURL(source);
 try{
  const image=new Image();image.src=url;await image.decode();
  if(!image.naturalWidth||!image.naturalHeight)throw new Error('Invalid photo');
  const canvas=document.createElement('canvas');let size=Math.min(1600,Math.max(image.naturalWidth,image.naturalHeight));
  for(let attempt=0;attempt<5;attempt++){
   const ratio=Math.min(1,size/Math.max(image.naturalWidth,image.naturalHeight));canvas.width=Math.max(1,Math.round(image.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(image.naturalHeight*ratio));
   const context=canvas.getContext('2d');if(!context)throw new Error('Image processing unavailable');
   context.fillStyle='#fff';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(image,0,0,canvas.width,canvas.height);
   for(const quality of [.86,.75,.63]){
    const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/jpeg',quality));
    if(blob&&blob.size<=MAX_PHOTO_BYTES)return new File([blob],source.name.replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg'});
   }
   size*=.8;
  }
  throw new Error('Photo could not be resized');
 }catch(error){if(error instanceof Error&&error.message.includes('20 MB'))throw error;throw new Error(`${source.name}: could not prepare this photo. Try a JPG or a screenshot.`)}
 finally{URL.revokeObjectURL(url)}
}
