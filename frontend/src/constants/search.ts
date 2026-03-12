export const SORT_RELEVANCE = 'relevance';
export const SORT_RATING_DESC = 'rating_desc';
export const SORT_REVIEWS_DESC = 'reviews_desc';
export const SORT_NAME_ASC = 'name_asc';

export type SortKey = typeof SORT_RELEVANCE | typeof SORT_RATING_DESC | typeof SORT_REVIEWS_DESC | typeof SORT_NAME_ASC;

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: SORT_RELEVANCE, label: 'Relevance' },
  { value: SORT_RATING_DESC, label: 'Highest Rated' },
  { value: SORT_REVIEWS_DESC, label: 'Most Reviewed' },
  { value: SORT_NAME_ASC, label: 'Name A-Z' },
];

export const RATING_THRESHOLDS = [3, 3.5, 4, 4.5] as const;

export const PRICE_RANGE_OPTIONS = [1, 2, 3, 4] as const;
