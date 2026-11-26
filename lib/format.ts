export function parseNumericPrice(price: number | string): number | null {
  if (typeof price === "number") {
    return Number.isFinite(price) ? price : null;
  }

  const cleaned = String(price).replace(/,/g, "").trim();
  if (!cleaned) return null;

  const num = Number(cleaned);
  return Number.isNaN(num) || !Number.isFinite(num) ? null : num;
}

export function formatPrice(price: number | string): string {
  const numericValue = parseNumericPrice(price);
  if (numericValue !== null) {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(
      numericValue
    );
  }
  return String(price);
}

export function getStatusBadgeClasses(status: string | null): string {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "available") {
    return "bg-emerald-950/70 text-emerald-300 border-emerald-700";
  }
  if (normalized === "sold") {
    return "bg-zinc-800 text-zinc-400 border-zinc-700";
  }
  return "bg-amber-950/70 text-amber-300 border-amber-700";
}