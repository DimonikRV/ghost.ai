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
 * Canonical name collision key used to enforce uniqueness per owner.
 * Names that slugify to an empty string (e.g. "!!!") fall back to their
 * trimmed lowercase form so distinct special-character-only names don't
 * collide on a shared "" key. Mirrors the DB backfill in the name_key
 * migration.
 */
export function toNameKey(name: string): string {
  const slug = slugify(name);
  return slug || name.trim().toLowerCase();
}

/**
 * Proposes alternative display names for `name` that don't collide with any
 * existing nameKey, e.g. "My Project 2", "My Project 3". `existingNameKeys`
 * should be the nameKey values already taken by the same owner.
 */
export function suggestAlternativeNames(
  name: string,
  existingNameKeys: string[],
  count = 3,
  maxLength = 255,
): string[] {
  const baseKey = toNameKey(name);
  const base = name.trim();
  const used = new Set(
    existingNameKeys.map((key) => toNameKey(key).toLowerCase()),
  );

  const suggestions: string[] = [];
  let n = 2;
  while (suggestions.length < count) {
    const suffix = ` ${n}`;
    const maxBaseLength = Math.max(0, maxLength - suffix.length);
    const trimmedBase =
      base.length > maxBaseLength
        ? base.slice(0, maxBaseLength).replace(/[\s_-]+$/g, "")
        : base;
    const candidateName = `${trimmedBase}${suffix}`.trim();
    if (!candidateName) {
      break;
    }

    const candidateKey = toNameKey(candidateName);
    if (!used.has(candidateKey) && candidateKey !== baseKey) {
      suggestions.push(candidateName);
    }
    n++;
  }
  return suggestions;
}
