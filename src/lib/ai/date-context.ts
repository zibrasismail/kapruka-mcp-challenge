import "server-only";

const COLOMBO_TZ = "Asia/Colombo";

export function getColomboToday(): { iso: string; display: string; year: number } {
  const now = new Date();
  const iso = new Intl.DateTimeFormat("en-CA", {
    timeZone: COLOMBO_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const display = new Intl.DateTimeFormat("en-US", {
    timeZone: COLOMBO_TZ,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);

  const year = Number(iso.slice(0, 4));
  return { iso, display, year };
}

export function buildDateContextSection(): string {
  const { iso, display, year } = getColomboToday();

  return `## Current date (Asia/Colombo — authoritative)
- **Today:** ${display} (\`${iso}\`)
- **Current year:** ${year}

## Delivery date rules (follow strictly)
- When the customer gives a date **without a year** (e.g. "July 5", "5 July", "7/5"):
  - If that month/day is **today or later** in ${year} → use \`${year}-MM-DD\`
  - If that month/day is **earlier than today** in ${year} → use \`${year + 1}-MM-DD\`
- Example: today is ${iso} → "July 5" means \`${year}-07-05\` (future — do **not** say it has passed)
- Only say a date "has passed" if it is **before** \`${iso}\` in Asia/Colombo
- Always pass \`delivery_date\` / \`delivery.date\` to tools as **YYYY-MM-DD** (Colombo calendar)`;
}