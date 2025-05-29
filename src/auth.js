import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
import { dummyData } from "./app/shared/users.js"
import cookie from 'cookie'

import { cookies as nextCookies } from 'next/headers'

export const { handlers, signIn, signOut, auth } = NextAuth({
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
      let callsign


      if (!callsign) {
        try {
          const c = nextCookies()
          callsign = c.get('pending-callsign')?.value
        } catch (e) {
          if (rest?.request?.headers?.cookie) {
            const cookies = cookie.parse(rest.request.headers.cookie)
            callsign = cookies['pending-callsign']
          }
        }
      }

      // console.log('signIn callback', { callsign, user, account })

      if (!callsign) return false

      const entry = dummyData.find(e => e.callsign === callsign)
      if (!entry || entry.discordId !== account.providerAccountId) {
        return false
      }

      user.callsign = callsign
      return true
    },

    async jwt({ token, user }) {
      if (user?.callsign) token.callsign = user.callsign
      return token
    },

    async session({ session, token }) {
      if (token?.callsign) session.user.callsign = token.callsign
      return session
    }
  },
  pages: {
    signIn: '/crew',
    error: '/crew'
  },
})