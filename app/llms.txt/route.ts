export const dynamic = "force-static";

export async function GET() {
  const body = `# Neyroeros

> Curated 18+ AI-art platform. Published works, videos and stories are manually moderated. Content is intended for adults only.

## Main sections
- Gallery: https://neyroeros.com/
- Categories: https://neyroeros.com/categories
- AI videos: https://neyroeros.com/videos
- Stories: https://neyroeros.com/stories
- Collections: https://neyroeros.com/collections
- Trending works: https://neyroeros.com/trending
- Community rules and content policy: https://neyroeros.com/rules
- About, moderation process and contact: https://neyroeros.com/about

## Discovery
- Sitemap: https://neyroeros.com/sitemap.xml
- Image sitemap: https://neyroeros.com/image-sitemap.xml
- Robots: https://neyroeros.com/robots.txt

## Content policy
Neyroeros prohibits depictions of minors, sexual violence, non-consensual content, unauthorized explicit deepfakes of real people, and copyright-infringing uploads. See the Rules page for the complete policy.
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
