// app/components/dashboard/ProfileContainer.jsx
import BasicInfo from './BasicInfo'
import PirepsTable from './PirepsTable'
import Notams from './Notams'
import { Grid } from '@chakra-ui/react'

async function getUserData(callsign) {
  try {
    let baseUrl;
    if (typeof window === 'undefined') {
      if (process.env.NEXT_PUBLIC_VERCEL_URL) {
        baseUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
      } else if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      } else {
        baseUrl = 'http://localhost:3000';
      }
    } else {
      baseUrl = '';
    }
    const response = await fetch(`${baseUrl}/api/users/userdash?id=${callsign}`, {
      cache: 'no-store'
    })
    if (!response.ok) {
      throw new Error('Failed to fetch user data')
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error('Error fetching user data:', error)
    return null
  }
}

async function getNotams() {
  try {
    let baseUrl;
    if (typeof window === 'undefined') {
      if (process.env.NEXT_PUBLIC_VERCEL_URL) {
        baseUrl = `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
      } else if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      } else {
        baseUrl = 'http://localhost:3000';
      }
    } else {
      baseUrl = '';
    }
    const response = await fetch(`${baseUrl}/api/notams`, {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error('Failed to fetch NOTAMs')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching NOTAMs:', error)
    return { data: [], count: 0, cached: false }
  }
}

export default async function ProfileContainer({ user }) {
  if (!user) return null

  const [ userData, notamsData ] = await Promise.all([
    getUserData(user.callsign),
    getNotams()
  ])

  if (!userData) return null

  return (
    <>
      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={1}>
        <BasicInfo
          ifcName={userData.ifcName}
          image={user.image}
          flightTime={userData.flightTime}
          rank={userData.rank}
        />
        <Notams notams={notamsData.data} />
      </Grid>
      <PirepsTable pireps={userData.pireps} />
    </>
  )
}
