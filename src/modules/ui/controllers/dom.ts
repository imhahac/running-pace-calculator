/**
 * Tiny DOM helpers shared by the tool controllers, replacing the per-controller
 * re-implementation of "read a number / set text / validate a select value".
 * Keep these intentionally small — controllers stay thin and consistent.
 */

/** parseFloat of an input/select value; NaN when the element is missing/empty. */
export function num(id: string): number {
  return parseFloat((document.getElementById(id) as HTMLInputElement | null)?.value || '');
}

/** parseInt (base 10) of an input/select value; NaN when missing/empty. */
export function int(id: string): number {
  return parseInt((document.getElementById(id) as HTMLInputElement | null)?.value || '', 10);
}

/** Set textContent when the element exists (no-op otherwise). */
export function setText(id: string, value: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * Constrain a raw <select>/string value to a known set, falling back when it is
 * missing or unrecognised. Pure (no DOM) — the enum-guard pattern every
 * controller hand-rolled, now in one tested place.
 */
export function pickOption<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
  fallback: T
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}
