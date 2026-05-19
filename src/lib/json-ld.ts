/**
 * Safely serialize structured data for `<script type="application/ld+json">`.
 *
 * `JSON.stringify` does not escape `</script>` — a future title or excerpt
 * containing that literal would break out of the script element and become
 * an XSS vector. We also escape U+2028 / U+2029 which are valid JSON but
 * invalid as raw JS string literals.
 */
const LS = String.fromCharCode(0x2028);
const PS = String.fromCharCode(0x2029);
const UNSAFE_LINE_TERMINATORS = new RegExp(`[${LS}${PS}]`, 'g');

export function jsonLdString(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(UNSAFE_LINE_TERMINATORS, (c) =>
      c === LS ? '\\u2028' : '\\u2029'
    );
}
