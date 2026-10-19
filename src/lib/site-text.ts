/**
 * Helpers for admin-editable site text (rk-studio, Content, Texts tab).
 * Client-safe: no server imports. Overrides are stored as flat dot-paths
 * (e.g. "home.what_i_do.cards.0.title") per locale in SiteSettings 'site-text'.
 */

/** Top-level dictionary sections shown in the admin, in display order */
export const EDITABLE_TEXT_SECTIONS = [
  'home',
  'about',
  'services',
  'contact',
  'blog',
  'links_page',
  'nav',
  'footer',
  'meta',
] as const;

export type TextOverrides = Record<string, string>;
export type SiteTextStore = Partial<Record<'en' | 'fr' | 'ar', TextOverrides>>;

/** Every string leaf of `obj` as { "a.b.0.c": "value" } (arrays use their index) */
export function flattenStrings(obj: unknown, prefix = '', out: TextOverrides = {}): TextOverrides {
  if (typeof obj === 'string') {
    if (prefix) out[prefix] = obj;
    return out;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => flattenStrings(v, prefix ? `${prefix}.${i}` : String(i), out));
    return out;
  }
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      flattenStrings(v, prefix ? `${prefix}.${k}` : k, out);
    }
  }
  return out;
}

/** Flattened strings of the editable sections only */
export function flattenEditable(dict: Record<string, unknown>): TextOverrides {
  const out: TextOverrides = {};
  for (const section of EDITABLE_TEXT_SECTIONS) {
    if (section in dict) flattenStrings(dict[section], section, out);
  }
  return out;
}

/**
 * Returns a deep copy of `base` with string overrides applied by dot-path.
 * A path is skipped when it does not exist in `base` or its base value is not
 * a string, so an override can never change the dictionary's shape.
 */
export function applyTextOverrides<T>(base: T, overrides: TextOverrides | null | undefined): T {
  if (!overrides || typeof overrides !== 'object') return base;
  const entries = Object.entries(overrides).filter(
    ([k, v]) => typeof k === 'string' && typeof v === 'string' && v.trim() !== ''
  );
  if (entries.length === 0) return base;

  const copy = structuredClone(base) as unknown;
  for (const [path, value] of entries) {
    const parts = path.split('.');
    const last = parts.pop();
    if (!last) continue;
    let node: unknown = copy;
    for (const key of parts) {
      if (node === null || typeof node !== 'object') { node = undefined; break; }
      if (!Object.prototype.hasOwnProperty.call(node, key)) { node = undefined; break; }
      node = (node as Record<string, unknown>)[key];
    }
    if (
      node !== null &&
      typeof node === 'object' &&
      Object.prototype.hasOwnProperty.call(node, last) &&
      typeof (node as Record<string, unknown>)[last] === 'string'
    ) {
      (node as Record<string, unknown>)[last] = value;
    }
  }
  return copy as T;
}
