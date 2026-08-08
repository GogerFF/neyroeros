"use client";
import { Volume2, VolumeX, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

type HeroVideo = { id: string; title: string; durationSec: number; webmKey: string | null };

function useReducedMotion() {
  return useSyncExternalStore(
    (cb) => { const mq = window.matchMedia("(prefers-reduced-motion: reduce)"); mq.addEventListener("change", cb); return () => mq.removeEventListener("change", cb); },
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export function HeroVideoSlideshow({ videos }: { videos: HeroVideo[] }) {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const reduce = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playedRef = useRef(false);

  useEffect(() => { setReady(false); playedRef.current = false; }, [index]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || paused || !ready || playedRef.current) return;
    v.currentTime = 0;
    v.muted = muted;
    v.play().then(() => { playedRef.current = true; }).catch(() => {});
  }, [ready, paused, muted, index]);

  useEffect(() => {
    if (paused || reduce || videos.length < 2) return;
    const timer = setTimeout(() => setIndex(x => (x + 1) % videos.length), videos[index].durationSec * 1000);
    return () => clearTimeout(timer);
  }, [index, paused, reduce, videos]);

  const onCanPlay = useCallback(() => setReady(true), []);

  return <section className="video-hero" aria-label="Подборка AI-арта">
    <div className="video-stage">
      <video ref={videoRef} muted autoPlay playsInline preload="auto" key={videos[index].id} poster={`/api/hero/${videos[index].id}/poster`} onCanPlay={onCanPlay} onLoadedData={onCanPlay}>
        <source src={`/api/hero/${videos[index].id}/mp4`} type="video/mp4"/>
        {videos[index].webmKey && <source src={`/api/hero/${videos[index].id}/webm`} type="video/webm"/>}
      </video>
    </div>
    <div className="video-overlay"><span className="eyebrow">Кураторская галерея · 18+</span><h1>Искусство<br/><em>после полуночи</em></h1><p>Пространство для смелых AI-художников. Загружайте работы, проходите ручную модерацию и находите свою аудиторию.</p><div className="hero-actions"><a className="button" href="/dashboard/uploads/new">Загрузить работу</a><a className="ghost" href="/trending">Смотреть горячее</a></div></div>
    <div className="video-controls"><button onClick={() => setPaused(x => !x)} aria-label={paused ? "Продолжить" : "Пауза"}>{paused ? <Play size={18}/> : <Pause size={18}/>}</button><button onClick={() => setMuted(x => !x)} aria-label={muted ? "Включить звук" : "Выключить звук"}>{muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button>{videos.length > 1 && <span>{index + 1} / {videos.length}</span>}</div>
  </section>;
}
