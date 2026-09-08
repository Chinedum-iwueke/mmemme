const sensitiveKeys = /authorization|cookie|token|secret|password|nin|bvn|payload/i;

export function requestWithinLimit(request: Request, maximumBytes = 64 * 1024) {
  const value = request.headers.get("content-length");
  return !value || (Number.isSafeInteger(Number(value)) && Number(value) <= maximumBytes);
}

export function redactedLog(
  level: "info" | "warn" | "error",
  event: string,
  fields: Record<string, unknown> = {},
) {
  const safe = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      sensitiveKeys.test(key) ? "[REDACTED]" : value,
    ]),
  );
  console[level](JSON.stringify({ level, event, at: new Date().toISOString(), ...safe }));
}
