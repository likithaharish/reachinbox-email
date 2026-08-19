import session from "express-session";
import type { CookieOptions, Response } from "express";
import { env } from "../config/env";

const isProduction = env.NODE_ENV === "production";

/** Default express-session cookie. Also clear the Redis-era name if it is still present. */
export const SESSION_COOKIE_NAME = "connect.sid";
const LEGACY_SESSION_COOKIE_NAME = "reachinbox.sid";

export function sessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    path: "/",
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export function clearSessionCookie(res: Response) {
  const flags = {
    httpOnly: true,
    path: "/",
    sameSite: isProduction ? ("none" as const) : ("lax" as const),
    secure: isProduction,
  };
  res.clearCookie(SESSION_COOKIE_NAME, flags);
  res.clearCookie(LEGACY_SESSION_COOKIE_NAME, flags);
}

/**
 * Google login uses in-memory sessions (not Redis).
 * Redis is reserved for BullMQ / rate limits (Upstash). Mixing login into Redis
 * broke OAuth on the free Render + Vercel split-origin setup.
 *
 * Trade-off: Render free restarts still drop the session and require a new Google login.
 */
export function createSessionMiddleware() {
  return session({
    name: SESSION_COOKIE_NAME,
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    proxy: isProduction,
    cookie: sessionCookieOptions(),
  });
}
