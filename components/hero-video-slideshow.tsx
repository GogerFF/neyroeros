"use client";
import { Volume2, VolumeX, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type HeroVideo = { id: string; title: string; durationSec: number; webmKey: string | null };

export function HeroVideoSlideshow({ videos }: { videos: HeroVideo[] }) {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const update = () => setReduce(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Auto-advance to next video after duration
  useEffect(() => {
    if (paused || reduce || videos.length === 0) return;
    const timer = setTimeout(() => setIndex(x => (x + 1) % videos.length), videos[index].durationSec * 1000);
    return () => clearTimeout(timer);
  }, [index, paused, reduce, videos]);

  // Start playing when index changes
  useEffect(() => {
    const v = videoRef.current;
    if (!v || paused || reduce) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  }, [index, paused, reduce]);

  // Sync mute state
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.muted = muted;
  }, [muted, index]);

  if (reduce) {
    return <section className="video-hero" aria-label="Подборка AI-арта">
      <div className="video-stage" style={{ background: `url(/api/hero/${videos[0].id}/poster) center/cover no-repeat` }}/>
      <div className="video-overlay"><span className="eyebrow">Кураторская галерея · 18+</span><h1>Искусство<br/><em>после полуночи</em></h1><p>Пространство для смелых AI-художников. Загружайте работы, проходите ручную модерацию и находите свою аудиторию.</p><div className="hero-actions"><a className="button" href="/dashboard/uploads/new">Загрузить работу</a><a className="ghost" href="/trending">Смотреть горячее</a></div></div>
    </section>;
  }

  return <section className="video-hero" aria-label="Подборка AI-арта">
    <div className="video-stage">
      <video ref={videoRef} muted playsInline key={videos[index].id} poster={`/api/hero/${videos[index].id}/poster`}>
        <source src={`/api/hero/${videos[index].id}/mp4`} type="video/mp4"/>
        {videos[index].webmKey && <source src={`/api/hero/${videos[index].id}/webm`} type="video/webm"/>}
      </video>
    </div>
    <div className="video-overlay"><span className="eyebrow">Кураторская галерея · 18+</span><h1>Искусство<br/><em>после полуночи</em></h1><p>Пространство для смелых AI-художников. Загружайте работы, проходите ручную модерацию и находите свою аудиторию.</p><div className="hero-actions"><a className="button" href="/dashboard/uploads/new">Загрузить работу</a><a className="ghost" href="/trending">Смотреть горячее</a></div></div>
    <div className="video-controls">
      <button onClick={() => setPaused(x => !x)} aria-label={paused ? "Продолжить" : "Пауза"}>{paused ? <Play size={18}/> : <Pause size={18}/>}</button>
      <button onClick={() => setMuted(x => !x)} aria-label={muted ? "Включить звук" : "Выключить звук"}>{muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button>
      <span>{index + 1} / {videos.length}</span>
    </div>
  </section>;
}
