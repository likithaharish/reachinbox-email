import crypto from "crypto";

/**
 * One-time Google login tickets.
 *
 * Chrome treats cookies set on the Render OAuth callback as first-party to
 * onrender.com. The SPA on Vercel then calls the API as a third-party site,
 * so that cookie is never sent and /api/v1/me returns 401.
 *
 * The callback therefore issues a short-lived ticket. The SPA exchanges it
 * with a credentialed POST (same pattern as admin login), which Set-Cookies
 * in the Vercel partition.
 */
const TICKET_TTL_MS = 2 * 60 * 1000;

type TicketRecord = {
  user: Express.User;
  expiresAt: number;
};

const tickets = new Map<string, TicketRecord>();

function pruneExpiredTickets() {
  const now = Date.now();
  for (const [id, record] of tickets) {
    if (record.expiresAt <= now) {
      tickets.delete(id);
    }
  }
}

export function createAuthTicket(user: Express.User): string {
  pruneExpiredTickets();
  const ticket = crypto.randomBytes(32).toString("base64url");
  tickets.set(ticket, { user, expiresAt: Date.now() + TICKET_TTL_MS });
  return ticket;
}

export function consumeAuthTicket(ticket: string): Express.User | null {
  pruneExpiredTickets();
  const record = tickets.get(ticket);
  if (!record) return null;
  tickets.delete(ticket);
  if (record.expiresAt <= Date.now()) return null;
  return record.user;
}
