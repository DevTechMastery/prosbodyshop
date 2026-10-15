'use client';
import dynamic from 'next/dynamic';
import {Component,useCallback,useEffect,useState,type ReactNode} from 'react';
const Scene=dynamic(()=>import('./CarScene'),{ssr:false});
class SceneBoundary extends Component<{children:ReactNode;onFailure:()=>void},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true}}
 componentDidCatch(){this.props.onFailure()}
 render(){return this.state.failed?null:this.props.children}
}
export default function HeroCar(){
 const [settings,setSettings]=useState<{mobile:boolean;reduced:boolean}|null>(null);
 const [ready,setReady]=useState(false);
 const [failed,setFailed]=useState(false);
 const [visible,setVisible]=useState(true);
 const handleReady=useCallback(()=>{setReady(true);setFailed(false)},[]);
 const handleFailure=useCallback(()=>{setReady(false);setFailed(true)},[]);
 useEffect(()=>{
  const motion=matchMedia('(prefers-reduced-motion: reduce)');const small=matchMedia('(max-width: 760px)');
  const update=()=>setSettings({mobile:small.matches,reduced:motion.matches});update();
  motion.addEventListener('change',update);small.addEventListener('change',update);
  const el=document.getElementById('hero-car');
  const observer=new IntersectionObserver(([entry])=>setVisible(entry.isIntersecting),{rootMargin:'150px'});
  if(el)observer.observe(el);
  return()=>{motion.removeEventListener('change',update);small.removeEventListener('change',update);observer.disconnect()};
 },[]);
 return <div id="hero-car" className="hero-car" data-ready={ready} aria-label="Black and red concept hypercar in a studio. Decorative illustration, not a completed shop repair.">
  <div className="studio-placeholder" aria-hidden={ready}><span role="status">{failed?'3D preview unavailable on this device.':'LOADING THE CONCEPT'}</span></div>
  <div className={`canvas-shell ${ready?'ready':''}`}><SceneBoundary onFailure={handleFailure}>{settings?<Scene {...settings} active={visible} onReady={handleReady} onUnavailable={handleFailure}/>:null}</SceneBoundary></div>
  <div className="car-caption"><span>BLACK / RED</span><span>CONCEPT STUDY · 01</span></div>
 </div>;
}
