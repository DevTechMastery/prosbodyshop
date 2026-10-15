/* Three.js uniforms are intentionally mutable GPU resources. */
/* eslint-disable react-hooks/immutability */
'use client';
import {Canvas,useFrame} from '@react-three/fiber';
import {Environment,Lightformer,ContactShadows,useGLTF} from '@react-three/drei';
import {useMemo,useRef,useEffect,Suspense} from 'react';
import * as THREE from 'three';

type RevealUniform={value:number};
function addReveal(material:THREE.Material,progress:RevealUniform){
 material.onBeforeCompile=shader=>{
  shader.uniforms.uReveal=progress;
  shader.vertexShader='varying vec3 vCarPosition;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCarPosition = position;');
  shader.fragmentShader='uniform float uReveal;\nvarying vec3 vCarPosition;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
   float grain = sin(vCarPosition.y*37.0 + sin(vCarPosition.z*19.0))*0.008;
   float boundary = mix(-3.2,3.2,uReveal);
   float distanceToEdge = boundary-vCarPosition.x+grain;
   if(distanceToEdge<0.0) discard;
  `);
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`float edgeLight = 1.0-smoothstep(0.0,0.035,distanceToEdge);
  outgoingLight += vec3(0.65,0.20,0.08)*edgeLight*0.45;
  #include <opaque_fragment>`);
 };
 material.customProgramCacheKey=()=> 'pros-continuous-body-reveal-v1';
}
function Vehicle({progress,onReady}:{progress:RevealUniform;onReady:()=>void}){
 const {scene}=useGLTF('/models/pros-concept.glb');
 const prepared=useMemo(()=>{
  scene.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(scene);const size=box.getSize(new THREE.Vector3());const center=box.getCenter(new THREE.Vector3());const scale=5.3/Math.max(size.x,size.z);
  const transform=new THREE.Matrix4().makeRotationY(-Math.PI/2).multiply(new THREE.Matrix4().makeScale(scale,scale,scale)).multiply(new THREE.Matrix4().makeTranslation(-center.x,-box.min.y,-center.z));
  const group=new THREE.Group();const geometries:THREE.BufferGeometry[]=[];const materials:THREE.Material[]=[];
  scene.traverse(node=>{
   if(!(node instanceof THREE.Mesh))return;
   let name=node.name;let parent=node.parent;
   while(!/^(Body|Interior|Wheel|Engine|Axles|License)/i.test(name)&&parent&&parent!==scene){name=parent.name;parent=parent.parent;}
   if(/license|emblem/i.test(name))return;
   const geometry=node.geometry.clone().applyMatrix4(transform.clone().multiply(node.matrixWorld));geometries.push(geometry);
   const exterior=/^Body/.test(name)&&!/^BodyUnderside/.test(name);
   const source=Array.isArray(node.material)?node.material:[node.material];
   const converted=source.map(original=>{
    let mat=original.clone() as THREE.MeshStandardMaterial;
    if(/Paint/.test(original.name)){
     const red=/Door[LR]Color1|Door[LR]Handle02/.test(name);
     mat=new THREE.MeshPhysicalMaterial({color:red?'#bc1c0b':'#111217',metalness:.73,roughness:.21,clearcoat:1,clearcoatRoughness:.08,side:THREE.DoubleSide});
    }else if(/Glass/.test(original.name)){
     mat=new THREE.MeshPhysicalMaterial({color:'#26323b',metalness:.3,roughness:.12,transparent:true,opacity:.78,clearcoat:1,depthWrite:false,side:THREE.DoubleSide});
    }else if(/Cage|Pillar|SeatsFrame|Axles/.test(name)){
     mat=new THREE.MeshStandardMaterial({color:'#939ba2',metalness:.9,roughness:.28});
    }
    if(exterior)addReveal(mat,progress);
    materials.push(mat);return mat;
   });
   const mesh=new THREE.Mesh(geometry,Array.isArray(node.material)?converted:converted[0]);mesh.name=name;group.add(mesh);
  });
  return {group,geometries,materials};
 },[scene,progress]);
 useEffect(()=>{
  let second=0;const first=requestAnimationFrame(()=>{second=requestAnimationFrame(onReady)});
  return()=>{cancelAnimationFrame(first);cancelAnimationFrame(second)};
 },[prepared,onReady]);
 useEffect(()=>()=>{prepared.geometries.forEach(g=>g.dispose());prepared.materials.forEach(m=>m.dispose())},[prepared]);
 return <primitive object={prepared.group}/>;
}
function Rail({points,radius=.035}:{points:[number,number,number][];radius?:number}){
 const geometry=useMemo(()=>new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),32,radius,8,false),[points,radius]);
 return <mesh geometry={geometry}><meshStandardMaterial color="#879099" metalness={.88} roughness={.3}/></mesh>
}
function Structure(){return <group>{[-1,1].map(side=><group key={side}>
 <Rail points={[[-2.05,.32,side*.58],[-1.3,.3,side*.65],[.65,.3,side*.65],[1.95,.42,side*.6]]}/>
 </group>)}{[-1.6,-.8,.6,1.55].map(x=><Rail key={x} points={[[x,.33,-.65],[x,.33,.65]]} radius={.028}/>)}</group>}
function Studio({mobile,reduced,onReady}:{mobile:boolean;reduced:boolean;onReady:()=>void}){
 const progress=useMemo(()=>({value:reduced||mobile?1:0}),[mobile,reduced]);const car=useRef<THREE.Group>(null);const light=useRef<THREE.PointLight>(null);const stage=useRef<HTMLElement|null>(null);
 useEffect(()=>{stage.current=document.querySelector('.hero-scroll')},[]);
 useFrame(({pointer,camera},delta)=>{
  const rect=stage.current?.getBoundingClientRect();const p=mobile||reduced?1:THREE.MathUtils.clamp(rect?-rect.top/Math.max(1,rect.height-window.innerHeight):0,0,1);const t=1-Math.exp(-delta*6);
  progress.value=THREE.MathUtils.lerp(progress.value,p,t);
  if(car.current)car.current.rotation.y=THREE.MathUtils.lerp(car.current.rotation.y,reduced?0:(mobile?0:pointer.x*.035)+p*.22,t);
  camera.position.set(mobile?-6.6:-6.5+p*.8,mobile?3.1:2.55-p*.2,mobile?7.6:7.1-p*.3);camera.lookAt(0,.66,0);
  if(light.current)light.current.position.x=-3+p*6;
 });
 return <><color attach="background" args={['#080809']}/><ambientLight intensity={.6}/><spotLight position={[-3,6,5]} intensity={95} angle={.7} penumbra={1} color="#fff4e8"/><pointLight ref={light} position={[-3,2,1]} color="#ff4b25" intensity={8}/><pointLight position={[3,3,-3]} intensity={30} color="#fa2c17"/><group ref={car}><Vehicle progress={progress} onReady={onReady}/><Structure/></group><Environment resolution={mobile?128:256}><Lightformer intensity={4} scale={[8,1,1]} position={[0,5,0]} rotation={[Math.PI/2,0,0]}/><Lightformer intensity={3} scale={[1,4,1]} position={[-4,2,3]} rotation={[0,Math.PI/3,0]}/><Lightformer intensity={4} color="#ff381a" scale={[6,.5,1]} position={[2,2,-4]} rotation={[0,Math.PI,0]}/><Lightformer intensity={2} color="#ffe3c0" scale={[7,.4,1]} position={[1,3,4]} rotation={[0,Math.PI,0]}/></Environment><ContactShadows position={[0,-.015,0]} scale={12} opacity={.7} blur={2.7} far={3} resolution={mobile?256:512} frames={1}/><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.025,0]}><planeGeometry args={[200,200]}/><meshStandardMaterial color="#09090b" metalness={.35} roughness={.3}/></mesh></>;
}
export default function CarScene({mobile,reduced,active,onReady,onUnavailable}:{mobile:boolean;reduced:boolean;active:boolean;onReady:()=>void;onUnavailable:()=>void}){return <Canvas style={{position:'absolute',inset:0,width:'100%',height:'100%',display:'block'}} resize={{scroll:false,debounce:0}} dpr={mobile?[1,1.25]:[1,1.5]} frameloop={reduced||!active?'demand':'always'} camera={{position:[-6.5,2.55,7.1],fov:mobile?36:33}} gl={{antialias:!mobile,alpha:false,powerPreference:'high-performance'}} onCreated={({camera,gl})=>{camera.lookAt(0,.66,0);gl.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();gl.domElement.style.opacity='0';onUnavailable()});gl.domElement.addEventListener('webglcontextrestored',()=>{gl.domElement.style.opacity='1';onReady()})}}><Suspense fallback={null}><Studio mobile={mobile} reduced={reduced} onReady={onReady}/></Suspense></Canvas>}
