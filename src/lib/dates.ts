const LONDON = "Europe/London";

/** Minutes London is ahead of UTC at the given instant (0 in winter, 60 in summer). */
function londonOffsetMinutes(at: Date): number {
  const name = new Intl.DateTimeFormat("en-GB", { timeZone: LONDON, timeZoneName: "shortOffset" })
    .formatToParts(at)
    .find((p) => p.type === "timeZoneName")?.value;
  const match = name?.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
  return match[1] === "-" ? -minutes : minutes;
}

function londonDateParts(at: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: LONDON,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    weekday: get("weekday"),
  };
}

/** UTC instant of midnight in London, `daysBack` days before the London date of `at`. */
export function startOfLondonDay(at: Date = new Date(), daysBack = 0): Date {
  const { year, month, day } = londonDateParts(at);
  const midnightAsUtc = Date.UTC(year, month - 1, day - daysBack);
  return new Date(midnightAsUtc - londonOffsetMinutes(new Date(midnightAsUtc)) * 60_000);
}

/** UTC instant of Monday 00:00 London time for the week containing `at`. */
export function startOfLondonWeek(at: Date = new Date()): Date {
  const order = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const daysSinceMonday = Math.max(0, order.indexOf(londonDateParts(at).weekday));
  return startOfLondonDay(at, daysSinceMonday);
}

const dateTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: LONDON,
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatLondonDateTime(date: Date): string {
  return dateTime.format(date);
}
