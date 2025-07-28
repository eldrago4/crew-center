import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
import { getDummyData, getStaff } from "./app/shared/users.js"
import { parse } from 'cookie'
import { cookies as nextCookies } from 'next/headers'


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
      if (!callsign) {
        try {
          const c = await nextCookies();
          callsign = c.get('pending-callsign')?.value;
        } catch (e) {
          if (rest?.request?.headers?.cookie) {
            const cookies = parse(rest.request.headers.cookie);
            callsign = cookies[ 'pending-callsign' ];
          }
        }
      }

      if (!callsign) return false;

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
      if (user?.callsign) token.callsign = user.callsign;
      if (typeof user?.redirectToIfcName === 'boolean') {
        token.redirectToIfcName = user.redirectToIfcName;
      } else {
        delete token.redirectToIfcName;
      }

      if (user?.discordId) token.discordId = user.discordId;
      return token;
    },


    async session({ session, token }) {
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
          const staffData = await getStaff();
          if (staffData && staffData[ token.callsign ]) {
            session.user.permissions = staffData[ token.callsign ].permissions || [];
          } else {
            session.user.permissions = [];
          }
        } catch (error) {
          console.error('Error fetching staff permissions:', error);
          session.user.permissions = [];
        }
      }
      return session;
    }
  },
  pages: {
    signIn: '/crew',
    error: '/crew'
  },
})