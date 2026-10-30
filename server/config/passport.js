
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "./prisma.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      state: true,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails?.[0]?.value?.toLowerCase();
        const name = profile.displayName?.trim() || "Google User";
        const emailVerified = profile._json?.email_verified === true;

        if (!email || !emailVerified) {
          return done(null, false, {
            message: "A verified Google email address is required.",
          });
        }

        // First, look for an account already linked to this Google ID.
        let user = await prisma.user.findUnique({
          where: { googleId },
        });

        if (user) {
          return done(null, user);
        }

        // Do not silently link Google to an existing password account.
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          return done(null, false, {
            message:
              "An account with this email already exists. Sign in using your existing method first.",
          });
        }

        user = await prisma.user.create({
          data: {
            name,
            email,
            googleId,
            emailVerified: true,
            passwordHash: null,
          },
        });

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

export default passport;
