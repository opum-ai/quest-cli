/**
 * Renders structured command payloads without coupling the human surface to a
 * particular result kind. Keys are sorted so the same payload always produces
 * the same bytes, independent of construction order. Empty arrays render the
 * intentional human marker `(empty)` (never bare JSON); empty objects keep
 * their established `{}` form.
 */
export function renderHumanPayload(
  payload: unknown,
  priorityKeys: readonly string[] = [],
): string {
  return `${renderLines(payload, 0, priorityKeys).join("\n")}\n`;
}

function renderLines(
  value: unknown,
  indentation: number,
  priorityKeys: readonly string[] = [],
): readonly string[] {
  const prefix = " ".repeat(indentation);
  if (value === null || typeof value !== "object")
    return [`${prefix}${renderScalar(value)}`];

  if (Array.isArray(value)) {
    if (value.length === 0) return [`${prefix}(empty)`];
    return value.flatMap((entry) => {
      if (entry === null || typeof entry !== "object")
        return [`${prefix}- ${renderScalar(entry)}`];
      return [
        `${prefix}-`,
        ...renderLines(entry, indentation + 2, priorityKeys),
      ];
    });
  }

  // QCLI-266: `quest help` puts `summary` and `usage` above the fields and
  // flags dump, because those two lines are the only ones that show the
  // positional form and a reader truncating the output has to reach them.
  // Everything else stays alphabetical, so output remains deterministic.
  const rank = (key: string) => {
    const index = priorityKeys.indexOf(key);
    return index === -1 ? priorityKeys.length : index;
  };
  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([left], [right]) =>
      rank(left) - rank(right) || (left < right ? -1 : left > right ? 1 : 0),
  );
  if (entries.length === 0) return [`${prefix}{}`];
  return entries.flatMap(([key, entry]) => {
    if (entry === null || typeof entry !== "object")
      return [`${prefix}${key}: ${renderScalar(entry)}`];
    return [
      `${prefix}${key}:`,
      ...renderLines(entry, indentation + 2, priorityKeys),
    ];
  });
}

function renderScalar(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === undefined) return "undefined";
  return JSON.stringify(value);
}
