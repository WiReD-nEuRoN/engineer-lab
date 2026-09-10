/**
 * Extract the first balanced JSON object or array from arbitrary text
 * (e.g. markdown code fences, surrounding prose, or NDJSON blobs).
 */
export function extractJson(text: string): any {
  // 1. Prefer a fenced code block
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : text;

  // 2. Try direct parse
  try {
    return JSON.parse(candidate.trim());
  } catch {}

  // 3. Extract first balanced { ... } or [ ... ]
  for (const open of ['{', '[']) {
    const close = open === '{' ? '}' : ']';
    const start = candidate.indexOf(open);
    if (start === -1) continue;
    let depth = 0;
    let inString = false;
    let esc = false;
    for (let i = start; i < candidate.length; i++) {
      const ch = candidate[i];
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === open) depth++;
      else if (ch === close) {
        depth--;
        if (depth === 0) {
          const slice = candidate.slice(start, i + 1);
          try {
            return JSON.parse(slice);
          } catch {
            break;
          }
        }
      }
    }
  }

  throw new Error('No valid JSON object or array found in output');
}

/**
 * Get an array of ideas from a parsed result, regardless of whether the model
 * returned an array directly or wrapped it in an object.
 */
export function toIdeasArray(parsed: any): any[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && Array.isArray(parsed.ideas)) return parsed.ideas;
  if (parsed && Array.isArray(parsed.projects)) return parsed.projects;
  if (parsed && Array.isArray(parsed.results)) return parsed.results;
  return [parsed];
}