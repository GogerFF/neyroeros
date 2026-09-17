"""Wrap detail-page data loaders in React.cache() so generateMetadata and the page
component share one query per request instead of hitting the DB twice."""
import pathlib
import re

ROOT = pathlib.Path(r"C:\Users\sklya\Desktop\html")
done = []


def read(rel: str) -> str:
    return (ROOT / rel).read_text(encoding="utf-8")


def write(rel: str, text: str) -> None:
    (ROOT / rel).write_text(text, encoding="utf-8")
    done.append(rel)


def add_cache_import(text: str) -> str:
    if re.search(r'import \{[^}]*\bcache\b[^}]*\} from "react"', text):
        return text
    first = re.search(r'^import .*?;\n', text, re.M)
    assert first, "no import line found"
    return text[:first.end()] + 'import { cache } from "react";\n' + text[first.end():]


def wrap_function(text: str, name: str) -> str:
    pattern = re.compile(rf'async function {name}\(([^)]*)\) \{{(.*?)\n\}}\n', re.S)
    m = pattern.search(text)
    assert m, f"function {name} not found"
    args, body = m.group(1), m.group(2)
    return text[:m.start()] + f'const {name} = cache(async ({args}) => {{{body}\n}});\n' + text[m.end():]


# --- simple cases: one loader per file -----------------------------------
for rel, name in (
    ("app/artwork/[slug]/page.tsx", "get"),
    ("app/videos/[slug]/page.tsx", "getVideo"),
    ("app/authors/[handle]/page.tsx", "getAuthor"),
):
    text = read(rel)
    text = add_cache_import(text)
    text = wrap_function(text, name)
    write(rel, text)

# --- stories: unify the two divergent queries into one cached loader ------
rel = "app/stories/[slug]/page.tsx"
text = read(rel)
text = add_cache_import(text)

meta_query = """  const story = await db.story.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    include: { illustrations: { take: 1, orderBy: { sortOrder: "asc" } }, author: true },
  });
"""
assert meta_query in text, "generateMetadata story query not found"
text = text.replace(meta_query, "  const story = await getStory(slug);\n", 1)

page_query = """  const story = await db.story.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    include: { author: true, illustrations: { orderBy: { sortOrder: "asc" } } },
  });
"""
assert page_query in text, "page story query not found"
text = text.replace(page_query, "  const story = await getStory(slug);\n", 1)

anchor = 'export const dynamic = "force-dynamic";\n'
assert anchor in text, "dynamic marker not found in stories page"
loader = (
    "\nconst getStory = cache(async (slug: string) => db.story.findFirst({\n"
    '  where: { slug, status: "PUBLISHED", deletedAt: null },\n'
    '  include: { author: true, illustrations: { orderBy: { sortOrder: "asc" } } },\n'
    "}));\n"
)
text = text.replace(anchor, anchor + loader, 1)
write(rel, text)

print("edited:", len(done))
for rel in done:
    print(" -", rel)
