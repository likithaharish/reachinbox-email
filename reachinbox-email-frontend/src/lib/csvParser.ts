const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function extractPotentialTokens(text: string) {
  // Handle csv, newline, semicolon, commas by splitting into rough tokens.
  return text
    .replace(/\r/g, "\n")
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseLeadEmailsFromText(text: string): string[] {
  const tokens = extractPotentialTokens(text);

  const emails = tokens
    .map((t) => t.trim().toLowerCase())
    .filter((t) => EMAIL_REGEX.test(t));

  // Deduplicate while preserving stable order.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const email of emails) {
    if (seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

export function mergeLeadEmails(...lists: string[][]): string[] {
  return parseLeadEmailsFromText(lists.flat().join("\n"));
}

