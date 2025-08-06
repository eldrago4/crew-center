'use server'

import { unstable_update } from '@/auth'

export async function updateUserRank(rank) {
  try {
    await unstable_update({ user: { rank: rank } })
    return { success: true }
  } catch (error) {
    console.error('Error updating user rank:', error)
    return { success: false, error: error.message }
  }
}
