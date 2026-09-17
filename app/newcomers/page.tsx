import { GalleryFeedPage } from "@/components/gallery-feed-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "Новички", description: "Новые AI-художники и их свежие работы на Neyroeros.", alternates: { canonical: "/newcomers" } };
export default function Newcomers(){ return <GalleryFeedPage kind="newcomers"/>; }
