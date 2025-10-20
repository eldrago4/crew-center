import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
import { getDummyData, getStaff } from "./app/shared/users.js"
import { parse } from 'cookie'
import { cookies as nextCookies } from 'next/headers'
import db from './db/client'
import { applicants } from './db/schema'
import { eq } from 'drizzle-orm'


export const { handlers, signIn, signOut, auth, unstable_update } = NextAuth({
  providers: [
    Discord({
      authorization: {
        params: {
          scope: "identify guilds.join"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile, ...rest }) {
      const dummyData = await getDummyData();
      let callsign;
      let ifcName;
      let isApplicant = false;
      if (!callsign) {
        try {
          const c = await nextCookies();
          callsign = c.get('pending-callsign')?.value;
          if (!callsign) {
            callsign = c.get('applicant-callsign')?.value;
            ifcName = c.get('applicant-ifcName')?.value;
            isApplicant = !!callsign;
          }
        } catch (e) {
          if (rest?.request?.headers?.cookie) {
            const cookies = parse(rest.request.headers.cookie);
            callsign = cookies[ 'pending-callsign' ];
            if (!callsign) {
              callsign = cookies[ 'applicant-callsign' ];
              ifcName = cookies[ 'applicant-ifcName' ];
              isApplicant = !!callsign;
            }
          }
        }
      }

      if (!callsign) return false;

      if (isApplicant) {
        await db.insert(applicants).values({
          id: callsign,
          ifcName: ifcName,
          discordId: account.providerAccountId,
          passedAt: new Date(),
        });
        user.callsign = callsign;
        user.discordId = account.providerAccountId;
        user.isApplicant = true;
        return true;
      }

      const entry = dummyData.find(e => e.callsign === callsign);
      if (!entry) return false;

      // Always set redirectToIfcName based on DB value for discordId
      user.callsign = callsign;
      user.discordId = account.providerAccountId;
      user.redirectToIfcName = (entry.discordId === null || entry.discordId === undefined);

      // Only allow sign in if discordId in DB is null or matches the current Discord account
      if (entry.discordId === null || entry.discordId === undefined) {
        return true;
      }
      if (String(entry.discordId) !== String(account.providerAccountId)) {
        return false;
      }
      return true;
    },


    async jwt({ token, user }) {
      if (user?.callsign) token.callsign = String(user.callsign).toUpperCase();
      if (typeof user?.redirectToIfcName === 'boolean') {
        token.redirectToIfcName = user.redirectToIfcName;
      } else {
        delete token.redirectToIfcName;
      }

      if (user?.discordId) token.discordId = user.discordId;
      return token;
    },


    async session({ session, token }) {
      if (token?.isApplicant) {
        // Don't set user properties for applicants
        return session;
      }
      if (token?.callsign) {
        session.user.callsign = token.callsign;
        let dbDiscordId = null;
        try {
          const dummyData = await getDummyData();
          const entry = dummyData.find(e => e.callsign === token.callsign);
          dbDiscordId = entry ? entry.discordId : null;
        } catch (e) {
          console.error('[AUTH SESSION] Error fetching user from getDummyData:', e);
        }
        session.user.redirectToIfcName = (dbDiscordId === null || dbDiscordId === undefined);

        if (token.discordId) {
          session.user.discordId = token.discordId;
        }

        try {
          let staffData = await getStaff();
          let perms = [];

          // If Redis returned a JSON string, try parse it
          if (typeof staffData === 'string') {
            try {
              staffData = JSON.parse(staffData);
            } catch (e) {
              // leave as-is; we'll handle gracefully below
            }
          }

          if (staffData) {
            try {
              if (typeof staffData === 'object' && !Array.isArray(staffData)) {
                // Normalize lookup keys: try token.callsign (already uppercased in jwt), fallback to lower
                const callsignKeys = [ token.callsign, token.callsign?.toUpperCase(), token.callsign?.toLowerCase() ];
                for (const k of callsignKeys) {
                  if (!k) continue;
                  const entry = staffData[ k ];
                  if (entry && Array.isArray(entry.permissions)) {
                    perms = entry.permissions;
                    break;
                  }
                }
              } else if (Array.isArray(staffData)) {
                // if staffData is an array of entries, find by callsign property
                const found = staffData.find(s => {
                  const sCalls = s?.callsign || s?.id || s?.key;
                  return sCalls === token.callsign || sCalls === token.callsign?.toUpperCase() || sCalls === token.callsign?.toLowerCase();
                });
                perms = found?.permissions || [];
              }
            } catch (e) {
              console.error('[AUTH SESSION] Error resolving staff permissions shape:', e);
              perms = [];
            }
          }

          // Normalize permission values to strings and lower-case for consistent checks
          if (Array.isArray(perms)) {
            session.user.permissions = perms.map(p => String(p).toLowerCase());
          } else {
            session.user.permissions = [];
          }
        } catch (error) {
          console.error('Error fetching staff permissions:', error);
          session.user.permissions = [];
        }

        // Add rank property, defaulting to null
        session.user.rank = null;
      }
      return session;
    }
  },
  pages: {
    signIn: '/crew',
    error: '/crew'
  },
})