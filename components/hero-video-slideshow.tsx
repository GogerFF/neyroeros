"use client";
import Link from "next/link";
import { Volume2, VolumeX, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

type HeroVideo = { id: string; title: string; durationSec: number; webmKey: string | null };
type Preview = { id: string; slug: string; title: string };

export function HeroVideoSlideshow({ videos, previews }: { videos: HeroVideo[]; previews: Preview[] }) {
  const [index, setIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playedRef = useRef(false);

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video || paused || playedRef.current) return;
    video.muted = muted;
    video.play().then(() => { playedRef.current = true; }).catch(() => {});
  }, [muted, paused]);

  useEffect(() => { playedRef.current = false; }, [index]);
  useEffect(() => { if (!paused && videoRef.current?.readyState && !playedRef.current) play(); }, [index, paused, play]);

  const advance = useCallback(() => {
    if (!paused && videos.length > 1) setIndex(value => (value + 1) % videos.length);
  }, [paused, videos.length]);

  return <section className="video-hero" aria-label="Подборка AI-арта">
    <div className="video-stage"><video ref={videoRef} muted autoPlay playsInline preload="auto" key={videos[index].id} poster={`/api/hero/${videos[index].id}/poster`} onCanPlay={play} onLoadedData={play} onEnded={advance}><source src={`/api/hero/${videos[index].id}/mp4`} type="video/mp4"/>{videos[index].webmKey && <source src={`/api/hero/${videos[index].id}/webm`} type="video/webm"/>}</video></div>
    <div className="video-overlay"><span className="eyebrow">Кураторская галерея · 18+</span><h1>Искусство<br/><em>после полуночи</em></h1><p>Пространство для смелых AI-художников. Загружайте работы, проходите ручную модерацию и находите свою аудиторию.</p><div className="hero-actions"><a className="button" href="/dashboard/uploads/new">Загрузить работу</a><a className="ghost" href="/trending">Смотреть горячее</a></div></div>
    {previews.length > 0 && <aside className="video-preview" aria-label="Новые работы">{previews.map((art, position) => <Link className={`video-preview-card video-preview-${position}`} href={`/artwork/${art.slug}`} key={art.id}><img src={`/api/images/preview/${art.id}`} alt={art.title}/><span>{art.title}</span></Link>)}</aside>}
    <div className="video-controls"><button onClick={() => setPaused(value => !value)} aria-label={paused ? "Продолжить" : "Пауза"}>{paused ? <Play size={18}/> : <Pause size={18}/>}</button><button onClick={() => setMuted(value => !value)} aria-label={muted ? "Включить звук" : "Выключить звук"}>{muted ? <VolumeX size={18}/> : <Volume2 size={18}/>}</button>{videos.length > 1 && <span>{index + 1} / {videos.length}</span>}</div>
  </section>;
}
