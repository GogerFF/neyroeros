import { GalleryFeedPage } from "@/components/gallery-feed-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "Топ работ", description: "Самые популярные AI-работы на Neyroeros." };
export default function Top(){ return <GalleryFeedPage kind="top"/>; }
