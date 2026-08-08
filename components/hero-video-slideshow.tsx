"use client";
import { Volume2, VolumeX, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";

type HeroVideo = { id: string; title: string; durationSec: number; webmKey: string | null };
export function HeroVideoSlideshow({ videos }: { videos: HeroVideo[] }) {
  const [index, setIndex] = useState(0); const [muted, setMuted] = useState(true); const [paused, setPaused] = useState(false); const [reduce, setReduce] = useState(false);
  useEffect(()=>{const mq=window.matchMedia("(prefers-reduced-motion: reduce)");const update=()=>setReduce(mq.matches);update();mq.addEventListener("change",update);return()=>mq.removeEventListener("change",update)},[]);
  useEffect(()=>{if(paused||reduce)return;const timer=setTimeout(()=>setIndex(x=>(x+1)%videos.length),videos[index].durationSec*1000);return()=>clearTimeout(timer)},[index,paused,reduce,videos]);
  const video=videos[index];
  return <section className="video-hero" aria-label="Подборка AI-арта"><div className="video-stage">
    {videos.map((clip,i)=><video key={clip.id} className={i===index?"active":""} muted={muted} playsInline autoPlay={!paused&&!reduce} preload={i===index?"metadata":"none"} poster={`/api/hero/${clip.id}/poster`} aria-hidden={i!==index}><source src={`/api/hero/${clip.id}/mp4`} type="video/mp4"/>{clip.webmKey&&<source src={`/api/hero/${clip.id}/webm`} type="video/webm"/>}</video>)}
  </div><div className="video-overlay"><span className="eyebrow">Кураторская галерея · 18+</span><h1>Искусство<br/><em>после полуночи</em></h1><p>Пространство для смелых AI-художников. Загружайте работы, проходите ручную модерацию и находите свою аудиторию.</p><div className="hero-actions"><a className="button" href="/dashboard/uploads/new">Загрузить работу</a><a className="ghost" href="/trending">Смотреть горячее</a></div></div><div className="video-controls"><button onClick={()=>setPaused(x=>!x)} aria-label={paused?"Продолжить":"Пауза"}>{paused?<Play size={18}/>:<Pause size={18}/>}</button><button onClick={()=>setMuted(x=>!x)} aria-label={muted?"Включить звук":"Выключить звук"}>{muted?<VolumeX size={18}/>:<Volume2 size={18}/>}</button><span>{index+1} / {videos.length}</span></div></section>;
}
