import { GalleryFeedPage } from "@/components/gallery-feed-page";
export const dynamic = "force-dynamic";
export const metadata = { title: "Discover", description: "Откройте новые AI-работы на Neyroeros.", alternates: { canonical: "/discover" } };
export default function Discover(){ return <GalleryFeedPage kind="discover"/>; }
