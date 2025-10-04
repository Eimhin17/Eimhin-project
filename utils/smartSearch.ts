interface SearchableItem {
  [key: string]: any;
}

/**
 * Smart search function that performs fuzzy matching on specified fields
 * @param items Array of items to search through
 * @param query Search query string
 * @param searchFields Array of field names to search in
 * @returns Filtered array of items matching the search query
 */
export function smartSearch<T extends SearchableItem>(
  items: T[],
  query: string,
  searchFields: string[]
): T[] {
  if (!query || query.trim() === '') {
    return items;
  }

  const normalizedQuery = normalizeString(query);
  const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length > 0);

  return items.filter(item => {
    return searchFields.some(field => {
      const fieldValue = item[field];
      if (!fieldValue || typeof fieldValue !== 'string') {
        return false;
      }

      const normalizedField = normalizeString(fieldValue);

      // Exact match (highest priority)
      if (normalizedField.includes(normalizedQuery)) {
        return true;
      }

      // Word-based matching
      const fieldWords = normalizedField.split(/\s+/);

      // Check if all query words have a match in the field
      return queryWords.every(queryWord => {
        return fieldWords.some(fieldWord => {
          // Exact word match
          if (fieldWord.includes(queryWord)) {
            return true;
          }

          // Fuzzy matching for typos (allow 1-2 character differences)
          return calculateSimilarity(queryWord, fieldWord) > 0.7;
        });
      });
    });
  });
}

/**
 * Normalize string for better matching
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Calculate similarity between two strings using Levenshtein distance
 */
function calculateSimilarity(a: string, b: string): number {
  if (a.length === 0) return b.length === 0 ? 1 : 0;
  if (b.length === 0) return 0;

  const matrix = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) {
    matrix[0][i] = i;
  }

  for (let j = 0; j <= b.length; j++) {
    matrix[j][0] = j;
  }

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const maxLength = Math.max(a.length, b.length);
  return 1 - matrix[b.length][a.length] / maxLength;
}