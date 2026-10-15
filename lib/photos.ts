export const MAX_PHOTOS=10;
export const MAX_PHOTO_BYTES=340_000;
export const MAX_PHOTOS_BYTES=3_400_000;
export const MAX_REQUEST_BYTES=3_700_000;
export const MAX_SOURCE_BYTES=20_000_000;
export const PHOTO_TYPES=['image/jpeg','image/png','image/webp'];
export function imageType(bytes:Uint8Array):string|null{
 if(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 if(bytes.length>=8&&[137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b))return 'image/png';
 if(bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'image/webp';
 return null;
}
