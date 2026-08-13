/** Unicode-aware slugify: strips diacritics, keeps letters/digits. */
export function slugify(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * True when `newName` collides with any existing name (normalized via slugify).
 * Names that slugify to an empty string (e.g. "!!!") only collide with each
 * other when their trimmed lowercase forms are identical, so distinct
 * special-character-only names aren't falsely flagged as duplicates.
 */
export function hasNameCollision(existingNames: string[], newName: string): boolean {
  const newSlug = slugify(newName);
  const newTrimmed = newName.trim().toLowerCase();

  return existingNames.some((existingName) => {
    const existingSlug = slugify(existingName);
    if (existingSlug === "") {
      return newSlug === "" && existingName.trim().toLowerCase() === newTrimmed;
    }
    return existingSlug === newSlug;
  });
}
