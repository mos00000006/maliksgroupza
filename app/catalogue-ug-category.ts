/** Ensure an explicitly UG-labelled product is stored in UG, never Plumbing. */
export function correctUgCategory(name: string, category: string): string {
  const explicitUgCategory = /^(?:UG|UNDERGROUND|UNDERGROUND\s*\(UG\))$/i.test(category.trim());
  const explicitUgProduct = /\b(?:UG|UNDERGROUND)\b/i.test(name);
  return explicitUgCategory || explicitUgProduct ? "Underground (UG)" : category;
}
