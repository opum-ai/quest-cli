/**
 * Renders structured command payloads without coupling the human surface to a
 * particular result kind. Keys are sorted so the same payload always produces
 * the same bytes, independent of construction order.
 */
export function renderHumanPayload(payload: unknown): string {
  return `${renderLines(payload, 0).join("\n")}\n`;
}

function renderLines(value: unknown, indentation: number): readonly string[] {
  const prefix = " ".repeat(indentation);
  if (value === null || typeof value !== "object")
    return [`${prefix}${renderScalar(value)}`];

  if (Array.isArray(value)) {
    if (value.length === 0) return [`${prefix}(empty)`];
    return value.flatMap((entry) => {
      if (entry === null || typeof entry !== "object")
        return [`${prefix}- ${renderScalar(entry)}`];
      return [`${prefix}-`, ...renderLines(entry, indentation + 2)];
    });
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([left], [right]) => (left < right ? -1 : left > right ? 1 : 0),
  );
  if (entries.length === 0) return [`${prefix}{}`];
  return entries.flatMap(([key, entry]) => {
    if (entry === null || typeof entry !== "object")
      return [`${prefix}${key}: ${renderScalar(entry)}`];
    return [`${prefix}${key}:`, ...renderLines(entry, indentation + 2)];
  });
}

function renderScalar(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === undefined) return "undefined";
  return JSON.stringify(value);
}
