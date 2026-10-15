'use client';
import {useEffect,useRef,useState} from 'react';
import {MAX_PHOTOS} from '@/lib/photos';
import {preparePhoto} from '@/lib/prepare-photo';
function LocalPhoto({file,index}:{file:File;index:number}){
 const image=useRef<HTMLImageElement>(null);
 useEffect(()=>{const url=URL.createObjectURL(file);if(image.current)image.current.src=url;return()=>URL.revokeObjectURL(url)},[file]);
 // eslint-disable-next-line @next/next/no-img-element
 return <img ref={image} alt={`Damage photo ${index+1}`} width={160} height={120}/>;
}
export default function PhotoUpload({files,onChange,onBusy,disabled}:{files:File[];onChange:(files:File[])=>void;onBusy:(busy:boolean)=>void;disabled:boolean}){
 const [busy,setBusy]=useState(false);const [error,setError]=useState('');const input=useRef<HTMLInputElement>(null);const mounted=useRef(true);
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false}},[]);
 async function add(selected:File[]){
  if(busy||disabled)return;setError('');
  if(files.length+selected.length>MAX_PHOTOS){setError('Choose up to 10 photos in total. Remove a photo to add another.');return}
  setBusy(true);onBusy(true);const prepared:File[]=[];const errors:string[]=[];
  try{for(const file of selected){try{prepared.push(await preparePhoto(file))}catch(e){errors.push(e instanceof Error?e.message:'Could not read this photo.')}}if(mounted.current){onChange([...files,...prepared]);setError(errors.join(' '))}}
  finally{if(mounted.current){setBusy(false);onBusy(false)}}
 }
 return <fieldset disabled={disabled||busy} className="photo-upload"><legend><span>04</span> DAMAGE PHOTOS <small>OPTIONAL</small></legend>
  <p id="photo-help">Add up to 10 photos: an overall view and close-ups of the damage. JPG, PNG or WebP, up to 20 MB each. Photos are resized for email.</p>
  <input ref={input} id="damage-photos" className="photo-input" type="file" accept="image/jpeg,image/png,image/webp" multiple aria-describedby="photo-help photo-status photo-error" onChange={e=>{const selected=Array.from(e.target.files??[]);e.target.value='';void add(selected)}}/>
  <button className="photo-picker" type="button" disabled={files.length>=MAX_PHOTOS||disabled||busy} onClick={()=>input.current?.click()}><span aria-hidden="true">＋</span>{busy?'PREPARING PHOTOS…':'ADD DAMAGE PHOTOS'}<small>{files.length} / 10</small></button>
  <p id="photo-status" role="status" className="photo-status">{busy?'Optimizing your photos. Please wait…':files.length?`${files.length} photo${files.length===1?'':'s'} ready to attach.`:'No photos selected.'}</p>
  {files.length?<ul className="photo-grid">{files.map((file,i)=><li key={`${file.name}-${file.lastModified}-${i}`}>
   <LocalPhoto file={file} index={i}/><span>{file.name}</span><button type="button" aria-label={`Remove photo ${i+1}: ${file.name}`} onClick={()=>onChange(files.filter((_,index)=>index!==i))}>×</button>
  </li>)}</ul>:null}
  <p id="photo-error" role={error?'alert':undefined} className="photo-error">{error}</p>
 </fieldset>;
}
