"""Bulk edit: hub metadata/canonical + LCP priority for above-the-fold images.

Every replacement asserts its anchor first, so a file that does not match expected
content aborts the whole run instead of being silently half-edited.
"""
import pathlib
import re

ROOT = pathlib.Path(r"C:\Users\sklya\Desktop\html")
changed = []


def edit(rel: str, old: str, new: str) -> None:
    p = ROOT / rel
    text = p.read_text(encoding="utf-8")
    assert old in text, f"ANCHOR NOT FOUND in {rel}: {old[:70]!r}"
    p.write_text(text.replace(old, new, 1), encoding="utf-8")
    changed.append(rel)


# --- 1. pages that had no metadata at all -------------------------------
NEW_META = {
    "app/categories/page.tsx": (
        'canonical: "/categories"',
        'title: "Категории AI-искусства"',
        'description: "Все категории Neyroeros: портреты, фэнтези, киберпанк и другие направления нейросетевого искусства 18+."',
    ),
    "app/videos/page.tsx": (
        'canonical: "/videos"',
        'title: "AI-видео"',
        'description: "Видео, созданные авторами сообщества Neyroeros. Публикуются только после ручной модерации."',
    ),
    "app/stories/page.tsx": (
        'canonical: "/stories"',
        'title: "Истории"',
        'description: "Рассказы с иллюстрациями: тексты, созданные воображением и образами. Только 18+."',
    ),
}

for rel, (canonical, title, description) in NEW_META.items():
    meta = (
        f'export const metadata: Metadata = {{ title: {title}, description: {description}, '
        f'alternates: {{ {canonical} }} }};\n'
    )
    # these files are minified to varying degrees — match the marker with a regex
    p = ROOT / rel
    text = p.read_text(encoding="utf-8")
    marker = re.search(r'export const dynamic\s*=\s*"force-dynamic";', text)
    assert marker, f"dynamic marker not found in {rel}"
    p.write_text(
        text[:marker.start()]
        + 'import type { Metadata } from "next";\n' + meta
        + text[marker.start():],
        encoding="utf-8",
    )
    changed.append(rel)

# --- 2. search page: canonical + noindex --------------------------------
edit(
    "app/search/page.tsx",
    'export const dynamic="force-dynamic";',
    'export const metadata: Metadata = { title: "Поиск по галерее", alternates: { canonical: "/search" }, robots: { index: false, follow: true } };\nexport const dynamic="force-dynamic";',
)
edit("app/search/page.tsx", 'import{db}from"@/lib/db";',
     'import type { Metadata } from "next";\nimport{db}from"@/lib/db";')

# --- 3. gallery feeds: add canonical to the existing metadata -----------
for name in ("top", "trending", "newcomers", "discover"):
    rel = f"app/{name}/page.tsx"
    p = ROOT / rel
    text = p.read_text(encoding="utf-8")
    m = re.search(r'export const metadata = \{(.+?)\};', text)
    assert m, f"metadata object not found in {rel}"
    body = m.group(1).rstrip()
    edit(rel, m.group(0),
         f'export const metadata = {{{body}, alternates: {{ canonical: "/{name}" }} }};')

# --- 4. do not advertise the internal search page ------------------------
edit(
    "app/sitemap.ts",
    '    { url: "https://neyroeros.com/search", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },\n',
    "",
)

# --- 5. LCP: first cards eager + high priority ---------------------------
edit(
    "components/artwork-grid.tsx",
    '{items.map(a=><ArtworkCard key={a.id} art={a} locale={locale} m={m} categorySlug={categorySlug}/>)}',
    '{items.map((a, i) => <ArtworkCard key={a.id} art={a} locale={locale} m={m} categorySlug={categorySlug} priority={i < 4}/>)}',
)
edit(
    "components/artwork-card.tsx",
    'export function ArtworkCard({ art, locale, m, categorySlug }: { art:A; locale:Locale; m:Messages; categorySlug?:string }) {',
    'export function ArtworkCard({ art, locale, m, categorySlug, priority }: { art:A; locale:Locale; m:Messages; categorySlug?:string; priority?:boolean }) {',
)
edit(
    "components/artwork-card.tsx",
    'loading="lazy" width={art.asset?.width ?? 400}',
    'loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : "auto"} width={art.asset?.width ?? 400}',
)
edit(
    "app/artwork/[slug]/page.tsx",
    'alt={imageAlt} width={raw.asset?.width} height={raw.asset?.height} style={{ maxWidth: "100%", height: "auto" }}',
    'alt={imageAlt} fetchPriority="high" width={raw.asset?.width} height={raw.asset?.height} style={{ maxWidth: "100%", height: "auto" }}',
)

print("edited:", len(changed), "files")
for rel in changed:
    print(" -", rel)
