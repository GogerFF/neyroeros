"use client";
import { Volume2, VolumeX, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type HeroVideo = { id: string; title: string; durationSec: number; webmKey: string | null };

export function HeroVideoSlideshow({ videos }: { videos: HeroVideo[] }) {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(false);
  const [ready, setReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playedRef = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduce(mq.matches);
    const update = () => setReduce(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Reset ready when index changes
  useEffect(() => {
    setReady(false);
    playedRef.current = false;
  }, [index]);

  // Play when video is ready and not paused
  useEffect(() => {
    const v = videoRef.current;
    if (!v || paused || reduce || !ready || playedRef.current) return;
    v.currentTime = 0;
    v.muted = muted;
    v.play().then(() => { playedRef.current = true; }).catch(() => {});
  }, [ready, paused, reduce, muted, index]);

  // Auto-advance
  useEffect(() => {
    if (paused || reduce || videos.length === 0) return;
    const timer = setTimeout(() => setIndex(x => (x + 1) % videos.length), videos[index].durationSec * 1000);
    return () => clearTimeout(timer);
  }, [index, paused, reduce, videos]);

  const onCanPlay = useCallback(() => setReady(true), []);

  if (reduce) {
    return <section className="video-hero"><div className="video-stage" style={{ background: `url(/api/hero/${videos[0].id}/poster) center/cover no-repeat` }}/><div className="video-overlay"><span className="eyebrow">Кураторская галерея · 18+</span><h1>Искусство<br/><em>после полуночи</em></h1><p>Пространство для смелых AI-художников. Загружайте работы, проходите ручную модерацию и находите свою аудиторию.</p><div className="hero-actions"><a className="button" href="/dashboard/uploads/new">Загрузить работу</a><a className="ghost" href="/trending">Смотреть горячее</a></div></div></section>;
  }

  return <section className="video-hero">
    <div className="video-stage">
      <video ref={videoRef} muted playsInline key={videos[index].id} poster={`/api/hero/${videos[index].id}/poster`} onCanPlay={onCanPlay} onLoadedMetadata={onCanPlay} style={{ opacity: ready ? 1 : 0, transition: "opacity .4s" }}>
        <source src={`/api/hero/${videos[index].id}/mp4`} type="video/mp4"/>
        {videos[index].webmKey && <source src={`/api/hero/${videos[index].id}/webm`} type="video/webm"/>}
      </video>
    </div>
    <div className="video-overlay"><span className="eyebrow">Кураторская галерея · 18+</span><h1>Искусство<br/><em>после полуночи</em></h1><p>Пространство для смелых AI-художников. Загружайте работы, проходите ручную модерацию и находите свою аудиторию.</p><div className="hero-actions"><a className="button" href="/dashboard/uploads/new">Загрузить работу</a><a className="ghost" href="/trending">Смотреть горячее</a></div></div>
    <div className="video-controls"><button onClick={() => setPaused(x => !x)} aria-label={paused ? "Продолжить" : "Пауза"}>{paused ? <Play size={18}/> : <Pause size={18}/>}</button><button onClick={() => setMuted(x => !x)} aria-label={muted ? "Включить звук" : "Выключить звук"}>{muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button><span>{index + 1} / {videos.length}</span></div>
  </section>;
}
