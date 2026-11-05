/** Collect individually generated price tags into five-slot A4 image pages. */
export const A4_SINGLE_TAGS_PER_PAGE = 5;

export function paginateA4SingleTags<T>(
  items: readonly T[],
  copiesFor: (item: T) => number,
): T[][] {
  const expanded: T[] = [];
  for (const item of items) {
    const requested = copiesFor(item);
    const copies = Number.isSafeInteger(requested) ? Math.max(1, Math.min(5, requested)) : 1;
    for (let copy = 0; copy < copies; copy++) expanded.push(item);
  }
  const pages: T[][] = [];
  for (let index = 0; index < expanded.length; index += A4_SINGLE_TAGS_PER_PAGE) {
    pages.push(expanded.slice(index, index + A4_SINGLE_TAGS_PER_PAGE));
  }
  return pages;
}
