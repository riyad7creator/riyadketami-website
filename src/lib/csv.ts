/**
 * One CSV cell, safe for spreadsheets: values starting with = + - @ (or tab /
 * CR) get a leading ' so Excel / Sheets never run them as formulas, and cells
 * with commas, quotes or newlines are quoted.
 */
export function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function csvRow(values: unknown[]): string {
  return values.map(csvCell).join(',');
}
