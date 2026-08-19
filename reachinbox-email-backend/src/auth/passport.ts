import passport from "passport";
import { Strategy as GoogleStrategy, type Profile } from "passport-google-oauth20";
import { env } from "../config/env";
import { prisma } from "../db/prisma";

passport.serializeUser((user: Express.User, done) => {
  done(null, { id: user.id, googleSub: user.googleSub, isAdmin: Boolean(user.isAdmin) });
});

passport.deserializeUser(async (sessionUser: { id: string; googleSub: string; isAdmin?: boolean }, done) => {
  try {
    if (sessionUser.isAdmin || sessionUser.googleSub === "admin-local") {
      return done(null, {
        id: "admin",
        googleSub: "admin-local",
        email: env.ADMIN_EMAIL,
        name: "Administrator",
        isAdmin: true,
      });
    }

    const dbUser = await prisma.googleUser.findUnique({
      where: { googleSub: sessionUser.googleSub },
    });

    if (!dbUser) return done(null, undefined);

    return done(null, {
      id: dbUser.id,
      googleSub: dbUser.googleSub,
      email: dbUser.email,
      name: dbUser.name,
      avatarUrl: dbUser.avatarUrl,
      isAdmin: false,
    });
  } catch (error) {
    return done(error as Error);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      callbackURL: env.GOOGLE_CALLBACK_URL,
    },
    async (_accessToken: string, _refreshToken: string, profile: Profile, done: (err: Error | null, user?: Express.User) => void) => {
      try {
        const googleSub = profile.id;
        const email = profile.emails?.[0]?.value ?? "";
        const name = profile.displayName ?? "";
        const avatarUrl = profile.photos?.[0]?.value ?? null;

        if (!email || !name) {
          return done(new Error("Google profile missing required fields (email/name)"));
        }

        const user = await prisma.googleUser.upsert({
          where: { googleSub },
          create: {
            googleSub,
            email,
            name,
            avatarUrl,
          },
          update: {
            email,
            name,
            avatarUrl,
          },
        });

        return done(null, {
          id: user.id,
          googleSub: user.googleSub,
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
          isAdmin: false,
        });
      } catch (error) {
        return done(error as Error);
      }
    },
  ),
);

export { passport };

