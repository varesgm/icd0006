/**
 * Generic utility functions for the Task Manager application.
 * Each function uses TypeScript generics for type-safe reusability.
 */

/**
 * Filter an array by a predicate function.
 */
export function filterBy<T>(items: T[], predicate: (item: T) => boolean): T[] {
  return items.filter(predicate);
}

/**
 * Sort an array by a key extractor, with optional direction.
 * Returns a new array (does not mutate the original).
 */
export function sortBy<T>(
  items: T[],
  keyFn: (item: T) => string | number | null | undefined,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  const sorted = [...items].sort((a, b) => {
    const aVal = keyFn(a);
    const bVal = keyFn(b);
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal);
    }
    return (aVal as number) - (bVal as number);
  });
  return direction === 'desc' ? sorted.reverse() : sorted;
}

