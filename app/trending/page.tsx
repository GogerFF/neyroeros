import { GalleryFeedPage } from "@/components/gallery-feed-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "Trending", description: "Горячие AI-работы за последние 72 часа на Neyroeros.", alternates: { canonical: "/trending" } };
export default function Trending(){ return <GalleryFeedPage kind="trending"/>; }
