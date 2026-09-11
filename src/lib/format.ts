const trimDecimals = (n: number) => n.toFixed(2).replace(/\.?0+$/, "");

export function formatNumber(value: number): string {
  return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

/** "96%" for percent units, "1,200 hours" otherwise. */
export function withUnit(value: number, unit: string): string {
  const n = formatNumber(value);
  if (!unit) return n;
  return unit === "%" ? `${n}%` : `${n} ${unit}`;
}

/** Indian-style compact rupees: ₹85,000 · ₹12 L · ₹1.5 Cr. */
export function formatInr(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  const abs = Math.abs(value);
  const sign = value < 0 ? "−" : "";
  if (abs >= 1e7) return `${sign}₹${trimDecimals(abs / 1e7)} Cr`;
  if (abs >= 1e5) return `${sign}₹${trimDecimals(abs / 1e5)} L`;
  return `${sign}₹${abs.toLocaleString("en-IN")}`;
}

/** "IN_PROGRESS" → "In progress". */
export function humanise(value: string): string {
  const s = value.replace(/_/g, " ").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
