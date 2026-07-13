import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
import { getStaff } from "./app/shared/users.js"
import { parse } from 'cookie'
import { cookies as nextCookies } from 'next/headers'
import { cache } from 'react'
import db from './db/client'
import { applicants, users } from './db/schema'
import { eq } from 'drizzle-orm'

// Profile (rank/careerMode/ifcName/discordId) and staff permissions are cached
// inside the JWT and only re-fetched after these TTLs, so most auth() calls do
// zero DB/Redis work. unstable_update() forces an immediate refresh, which the
// ifc-name and career-enroll flows use when they change gating fields.
const PROFILE_TTL_MS = 60 * 60 * 1000            // 1h
const PERMISSIONS_TTL_MS = 24 * 60 * 60 * 1000   // 24h

async function fetchUserRow(callsign) {
  const rows = await db
    .select({
      discordId: users.discordId,
      rank: users.rank,
      careerMode: users.careerMode,
      ifcName: users.ifcName,
    })
    .from(users)
    .where(eq(users.id, callsign))
    .limit(1)
  return rows[0] || null
}

async function fetchPermissions(callsign) {
  let staffData = await getStaff()
  let perms = []

  // If Redis returned a JSON string, try parse it
  if (typeof staffData === 'string') {
    try {
      staffData = JSON.parse(staffData)
    } catch (e) {
      // leave as-is; we'll handle gracefully below
    }
  }

  if (staffData) {
    try {
      if (typeof staffData === 'object' && !Array.isArray(staffData)) {
        // Normalize lookup keys: try callsign (already uppercased in jwt), fallback to lower
        const callsignKeys = [ callsign, callsign?.toUpperCase(), callsign?.toLowerCase() ]
        for (const k of callsignKeys) {
          if (!k) continue
          const entry = staffData[ k ]
          if (entry && Array.isArray(entry.permissions)) {
            perms = entry.permissions
            break
          }
        }
      } else if (Array.isArray(staffData)) {
        // if staffData is an array of entries, find by callsign property
        const found = staffData.find(s => {
          const sCalls = s?.callsign || s?.id || s?.key
          return sCalls === callsign || sCalls === callsign?.toUpperCase() || sCalls === callsign?.toLowerCase()
        })
        perms = found?.permissions || []
      }
    } catch (e) {
      console.error('[AUTH] Error resolving staff permissions shape:', e)
      perms = []
    }
  }

  // Normalize permission values to strings and lower-case for consistent checks
  return Array.isArray(perms) ? perms.map(p => String(p).toLowerCase()) : []
}

const { handlers, signIn, signOut, auth: uncachedAuth, unstable_update } = NextAuth({
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

        try {
          await fetch(`https://discord.com/api/v10/guilds/${process.env.DISCORD_GUILD_ID}/members/${account.providerAccountId}`, {
            method: 'PUT',
            headers: {
              Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ access_token: account.access_token }),
          });
        } catch (e) {
          console.error('[AUTH] Failed to add applicant to guild:', e);
        }

        user.callsign = callsign;
        user.discordId = account.providerAccountId;
        user.isApplicant = true;
        return true;
      }

      let entry = null;
      try {
        entry = await fetchUserRow(callsign);
      } catch (e) {
        console.error('[AUTH] Error fetching user on sign in:', e);
      }
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


    async jwt({ token, user, trigger }) {
      if (user?.callsign) token.callsign = String(user.callsign).toUpperCase();
      if (user) {
        if (typeof user.redirectToIfcName === 'boolean') {
          token.redirectToIfcName = user.redirectToIfcName;
        } else {
          delete token.redirectToIfcName;
        }
        if (user.discordId) token.discordId = user.discordId;
        // Force a fresh fetch of profile/permissions on new sign-in
        delete token.profileRefreshedAt;
        delete token.permissionsRefreshedAt;
      }

      if (token?.callsign && !token?.isApplicant) {
        const now = Date.now();
        const forceRefresh = trigger === 'update';

        if (forceRefresh || !token.profileRefreshedAt || (now - token.profileRefreshedAt) > PROFILE_TTL_MS) {
          try {
            const row = await fetchUserRow(token.callsign);
            token.rank = row?.rank ?? null;
            token.careerMode = row?.careerMode ?? false;
            token.ifcName = row?.ifcName ?? null;
            token.redirectToIfcName = (row?.discordId === null || row?.discordId === undefined);
            token.profileRefreshedAt = now;
          } catch (e) {
            // Keep the stale token values; retry on the next request
            console.error('[AUTH JWT] Error refreshing user profile:', e);
          }
        }

        if (forceRefresh || !token.permissionsRefreshedAt || (now - token.permissionsRefreshedAt) > PERMISSIONS_TTL_MS) {
          try {
            token.permissions = await fetchPermissions(token.callsign);
            token.permissionsRefreshedAt = now;
          } catch (e) {
            console.error('[AUTH JWT] Error refreshing staff permissions:', e);
            if (!Array.isArray(token.permissions)) token.permissions = [];
          }
        }
      }

      return token;
    },


    async session({ session, token }) {
      if (token?.isApplicant) {
        // Don't set user properties for applicants
        return session;
      }
      if (token?.callsign) {
        session.user.callsign = token.callsign;
        session.user.redirectToIfcName = token.redirectToIfcName ?? true;
        if (token.discordId) {
          session.user.discordId = token.discordId;
        }
        session.user.permissions = Array.isArray(token.permissions) ? token.permissions : [];
        session.user.rank = token.rank ?? null;
        session.user.careerMode = token.careerMode ?? false;
        session.user.ifcName = token.ifcName ?? null;
      }
      return session;
    }
  },
  pages: {
    signIn: '/crew',
    error: '/crew'
  },
})

// Dedupe auth() within a single server render pass (layout + page + components
// share one call). Outside a render (proxy, route handlers) cache() is a
// passthrough. The proxy imports proxyAuth to use the unwrapped function.
export const auth = cache(uncachedAuth)
export const proxyAuth = uncachedAuth
export { handlers, signIn, signOut, unstable_update }
