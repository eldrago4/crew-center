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
      let callsign
      if (!callsign) {
        try {
          const c = await nextCookies()
          callsign = c.get('pending-callsign')?.value
        } catch (e) {
          if (rest?.request?.headers?.cookie) {
            const cookies = parse(rest.request.headers.cookie)
            callsign = cookies[ 'pending-callsign' ]
          }
        }
      }

      if (!callsign) return false

      const entry = dummyData.find(e => e.callsign === callsign);
      if (!entry) return false;

      if (entry.discordId === null || entry.discordId === undefined) {
        user.callsign = callsign;
        user.redirectToIfcName = true;
        user.discordId = account.providerAccountId;
        return true;
      }

      if (String(entry.discordId) !== String(account.providerAccountId)) {
        return false;
      }
      user.callsign = callsign;
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
        if (typeof token?.redirectToIfcName === 'boolean') {
          session.user.redirectToIfcName = token.redirectToIfcName;
        } else {
          session.user.redirectToIfcName = false;
        }

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
