export type TrendingInput = { likes24h: number; likes72h: number; views24h: number; views72h: number; ageHours: number };

export function trendingScore(input: TrendingInput) {
  return input.likes24h * 4 + input.likes72h * 2 + input.views24h + input.views72h * 0.25 - input.ageHours * 0.08;
}

export function isNewcomerEligible({ publishedWorks, accountAgeDays }: { publishedWorks: number; accountAgeDays: number }) {
  return publishedWorks <= 3 && accountAgeDays <= 30;
}
