export function artworkSearchWhere(query: string) {
  if (!query) return {};

  return {
    OR: [
      { title: { contains: query } },
      { description: { contains: query } },
      {
        translations: {
          some: {
            OR: [
              { title: { contains: query } },
              { description: { contains: query } },
            ],
          },
        },
      },
      { tags: { some: { tag: { name: { contains: query } } } } },
    ],
  };
}
