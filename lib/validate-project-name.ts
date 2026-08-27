/**
 * Allowed characters in a project name: Latin letters, digits, spaces,
 * hyphens, and underscores. This deliberately rejects other scripts
 * (e.g. Cyrillic, Greek, CJK) as well as all punctuation/symbols.
 */
const VALID_PROJECT_NAME_PATTERN = /^[A-Za-z0-9 _-]+$/;

/**
 * Returns a localized-friendly error message if `name` is not a valid project
 * name, or `null` when it is acceptable. `name` should already be trimmed.
 */
export function projectNameError(name: string): string | null {
  if (name === "") {
    return "Project name is required";
  }
  if (!VALID_PROJECT_NAME_PATTERN.test(name)) {
    return "Name may only contain Latin letters, numbers, spaces, hyphens, and underscores";
  }
  return null;
}
