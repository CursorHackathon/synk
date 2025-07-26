import { sendEmail } from "$lib/utils/email-service";
import { betterAuth } from "better-auth";
import { passkey } from "better-auth/plugins/passkey";
import dotenv from "dotenv";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

import { db } from "./db";
import { Profile } from "$src/models/profile.model";

dotenv.config();
// First ensure database connection
const dbInstance = await db.getInstance();

export const auth = betterAuth({
  database: mongodbAdapter(dbInstance),
  baseURL: "http://localhost:5173",

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          console.log('Creating profile for user:', user.email);
          
          try {
            // Create profile for the user with Google Calendar integration setup
            const profile = await Profile.create({
              userId: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              googleCalendar: {
                connected: false,
                syncEnabled: true,
                calendars: []
              },
              calendarEvents: [],
              preferences: {
                timezone: 'UTC',
                syncFrequency: 'daily',
                defaultCalendarVisibility: 'private',
                autoCreateEvents: false
              }
            });

            console.log('Profile created successfully for user:', user.email, profile.id);
          } catch (error) {
            console.error('Error creating profile for user:', user.email, error);
          }
        }
      }
    }
  },

  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"]
    }
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }: { user: { email: string; }, url: string; }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your password",
        html: `<p>Click the link to reset your password: <a href="${url}">Reset</a></p>
      `,
      });
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your email address",
        html: `<p>Click the link to verify your email: <a href="${url}">Verify</a></p>
      `,
      });
    },
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }
  },
});
