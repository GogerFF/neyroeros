/**
 * Title/description for a tag page.
 *
 * 90% of this site's tags hold a single work, so the old one-size template
 * ("Коллекция из 1 работ...") produced hundreds of near-identical pages. Below the
 * threshold the copy stops pretending to be a catalogue and names the neighbouring
 * directions instead, which is what makes the page worth crawling.
 */
export const TAG_THIN_THRESHOLD = 5;

export type TagPageTextInput = {
  name: string;
  publishedWorks: number;
  relatedNames: string[];
};

export function tagPageText({ name, publishedWorks, relatedNames }: TagPageTextInput): { title: string; description: string } {
  const neighbours = relatedNames.filter(Boolean).slice(0, 4);

  if (publishedWorks >= TAG_THIN_THRESHOLD) {
    return {
      title: `#${name} — ${publishedWorks} работ`,
      description: `Галерея AI-арта по тегу «${name}»: ${publishedWorks} работ. Нейро-искусство 18+ — портреты, фэнтези, киберпанк и цифровая живопись.`,
    };
  }

  const count = publishedWorks === 1 ? "одна работа" : `${publishedWorks} работы`;
  const near = neighbours.length ? ` Близкие направления: ${neighbours.map((n) => `#${n}`).join(", ")}.` : "";
  return {
    title: `#${name} — арт и похожие направления`,
    description: `Работы по тегу «${name}» — ${count}, а также похожие темы.${near} Нейро-искусство 18+, кураторская галерея AI-арта.`,
  };
}
