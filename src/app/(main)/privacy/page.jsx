export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Indian Virtual — how we collect, use, and protect your personal data.',
  alternates: { canonical: 'https://indianvirtual.site/privacy' },
}

import { Box, Flex, Heading, Text, VStack } from '@chakra-ui/react'

const LAST_UPDATED = 'May 9, 2025'
const CONTACT = 'ceo@indianvirtual.site'
const SITE = 'https://indianvirtual.site'

function Section({ title, children }) {
  return (
    <Box mb={10}>
      <Heading
        as="h2" size="md"
        fontFamily="'Playfair Display', serif"
        color="orange.600"
        mb={4} pb={2}
        borderBottom="2px solid"
        borderColor="orange.100"
      >
        {title}
      </Heading>
      <VStack align="stretch" gap={3}>
        {children}
      </VStack>
    </Box>
  )
}

function P({ children }) {
  return <Text color="gray.700" lineHeight="1.8" fontSize="sm">{children}</Text>
}

function Li({ children }) {
  return (
    <Flex gap={3} align="flex-start">
      <Box w="5px" h="5px" bg="orange.400" rounded="full" mt="8px" flexShrink={0} />
      <Text color="gray.700" lineHeight="1.8" fontSize="sm" flex={1}>{children}</Text>
    </Flex>
  )
}

export default function PrivacyPage() {
  return (
    <Box minH="100vh" bg="white">
      {/* Hero */}
      <Box
        bg="linear-gradient(135deg, #fff7ed 0%, #fff 50%, #eff6ff 100%)"
        borderBottom="1px solid" borderColor="orange.100"
        py={{ base: 14, md: 20 }}
      >
        <Box maxW="3xl" mx="auto" px={{ base: 5, md: 8 }}>
          <Box
            display="inline-flex" alignItems="center" gap={2}
            bg="orange.50" border="1px solid" borderColor="orange.200"
            px={3} py={1} rounded="full" mb={5}
          >
            <Box w="6px" h="6px" bg="orange.400" rounded="full" />
            <Text fontSize="xs" fontWeight="700" color="orange.600" letterSpacing="wider" textTransform="uppercase">
              Legal
            </Text>
          </Box>
          <Heading
            as="h1" size="2xl"
            fontFamily="'Playfair Display', serif"
            color="gray.900" mb={3} lineHeight="1.2"
          >
            Privacy Policy
          </Heading>
          <Text color="gray.500" fontSize="sm">Last updated: {LAST_UPDATED}</Text>
          <Text color="gray.600" mt={4} fontSize="sm" lineHeight="1.7" maxW="xl">
            Indian Virtual ("we", "us", "INVA") operates the Crew Center at{' '}
            <Text as="span" color="orange.500" fontWeight="600">{SITE}</Text>.
            This policy explains what personal data we collect, why, and how we protect it.
          </Text>
        </Box>
      </Box>

      {/* Body */}
      <Box maxW="3xl" mx="auto" px={{ base: 5, md: 8 }} py={{ base: 12, md: 16 }}>

        <Section title="1. Who We Are">
          <P>
            Indian Virtual is an informal virtual airline community operating within the Infinite Flight
            flight simulation platform. We are not a registered legal entity. For all privacy-related
            matters, contact us at <Text as="span" color="orange.500" fontWeight="600">{CONTACT}</Text>.
          </P>
          <P>
            Our platform is hosted at indianvirtual.site and serves members of our virtual airline crew.
            References to "Crew Center" mean the member portal at this domain.
          </P>
        </Section>

        <Section title="2. Data We Collect">
          <P><Text as="span" fontWeight="700" color="gray.800">2.1 Account Data (via Discord OAuth)</Text></P>
          <P>
            We authenticate exclusively through Discord's OAuth 2.0 service. When you log in, Discord
            provides us with:
          </P>
          <Li>Your Discord user ID (used as your unique identifier in our system)</Li>
          <Li>Your Discord username and display name</Li>
          <Li>Your Discord avatar hash (used to display your profile picture)</Li>
          <Li>Your Discord email address (stored for account management)</Li>
          <P>We do not store your Discord password at any point.</P>

          <P><Text as="span" fontWeight="700" color="gray.800">2.2 Crew Profile Data</Text></P>
          <Li>IFC (Infinite Flight Community) username — provided by you on registration</Li>
          <Li>Pilot rank and accumulated flight hours</Li>
          <Li>Permissions level (e.g., staff access)</Li>
          <Li>Last active timestamp</Li>

          <P><Text as="span" fontWeight="700" color="gray.800">2.3 Flight Records (PIREPs)</Text></P>
          <Li>Flight number, date, flight time</Li>
          <Li>Departure and arrival ICAO codes</Li>
          <Li>Aircraft type, operator, and earnings multiplier</Li>
          <Li>Pilot and admin comments</Li>
          <Li>Approval status and review timestamps</Li>

          <P><Text as="span" fontWeight="700" color="gray.800">2.4 Contribution & Payment Data</Text></P>
          <Li>IFC name and optional Discord ID associated with a contribution</Li>
          <Li>Contribution amount and target goal</Li>
          <Li>Razorpay payment ID (a reference token — we do not store card numbers, UPI handles, or bank details)</Li>
          <Li>Lotus Privé subscription ID and join date</Li>

          <P><Text as="span" fontWeight="700" color="gray.800">2.5 Technical & Usage Data</Text></P>
          <Li>Session tokens (stored in cookies via NextAuth — see Section 7)</Li>
          <Li>SimBrief OFP dispatch data tied to your account (flight routing, not personal data)</Li>
        </Section>

        <Section title="3. How We Use Your Data">
          <Li>To authenticate you and maintain your session</Li>
          <Li>To operate your pilot profile, track rank progression, and calculate flight hours</Li>
          <Li>To review and approve/reject PIREP submissions</Li>
          <Li>To send Discord notifications — including PIREP status updates, rank promotions, and inactivity notices — via our Discord bot and server webhooks</Li>
          <Li>To process and record your voluntary contributions via Razorpay</Li>
          <Li>To grant or revoke Discord roles corresponding to your rank or Lotus Privé subscription status</Li>
          <Li>To generate aggregate statistics displayed on the public stats page (no individual data is exposed)</Li>
        </Section>

        <Section title="4. Third-Party Services">
          <P>We share or process data with the following third parties:</P>

          <P><Text as="span" fontWeight="700" color="gray.800">Discord (discord.com)</Text></P>
          <P>
            Used for authentication (OAuth 2.0) and for delivering bot DMs and webhook notifications to
            our Discord server. Your Discord ID is shared with Discord when our bot performs role
            assignments or sends you a message. Discord's privacy policy applies:&nbsp;
            <Text as="a" href="https://discord.com/privacy" target="_blank" rel="noopener noreferrer" color="orange.500" fontWeight="600">discord.com/privacy</Text>
          </P>

          <P><Text as="span" fontWeight="700" color="gray.800">Razorpay (razorpay.com)</Text></P>
          <P>
            All payment processing is handled by Razorpay Software Private Limited, a PCI-DSS compliant
            payment gateway regulated under applicable RBI guidelines. When you make a contribution or
            subscribe to Lotus Privé, Razorpay collects and processes your payment details directly. We
            receive only a payment reference ID — we never see or store your card, UPI, or bank account
            data. Razorpay's privacy policy applies:&nbsp;
            <Text as="a" href="https://razorpay.com/privacy/" target="_blank" rel="noopener noreferrer" color="orange.500" fontWeight="600">razorpay.com/privacy</Text>
          </P>

          <P><Text as="span" fontWeight="700" color="gray.800">Vercel (vercel.com)</Text></P>
          <P>
            Our platform is hosted on Vercel's infrastructure. Request logs and edge network data may be
            processed by Vercel per their data processing agreement. Vercel's privacy policy applies.
          </P>

          <P><Text as="span" fontWeight="700" color="gray.800">Neon PostgreSQL & Upstash Redis</Text></P>
          <P>
            Pilot profile and PIREP data is stored in a PostgreSQL database hosted by Neon, Inc.
            Contribution totals, goal progress, and session caches are stored in Upstash Redis. Both
            providers operate under their own data protection policies and are contractually bound to
            handle data securely.
          </P>

          <P><Text as="span" fontWeight="700" color="gray.800">Infinite Flight Live API</Text></P>
          <P>
            We query the Infinite Flight Live API using your IF user UUID (provided by you) to fetch
            your last ATC session. This is a read-only lookup — no personal data is sent to Infinite
            Flight LLC beyond the UUID you have already registered with them.
          </P>

          <P><Text as="span" fontWeight="700" color="gray.800">SimBrief (navigraph.com)</Text></P>
          <P>
            Flight planning requests are routed through the SimBrief API using your SimBrief pilot ID.
            No personal data beyond the pilot ID and routing preferences is transmitted.
          </P>
        </Section>

        <Section title="5. Data Retention">
          <Li>
            <Text as="span" fontWeight="600">Pilot profiles and PIREPs:</Text> retained for as long as your account is active. If you request deletion, we will remove your personally identifiable data within 30 days.
          </Li>
          <Li>
            <Text as="span" fontWeight="600">Contribution records:</Text> retained indefinitely as financial audit records. Your IFC name and payment reference ID remain; we can anonymise your Discord ID on request.
          </Li>
          <Li>
            <Text as="span" fontWeight="600">Session tokens:</Text> expire automatically per NextAuth session settings (typically 30 days of inactivity).
          </Li>
          <Li>
            <Text as="span" fontWeight="600">Lotus Privé subscriber showcase:</Text> your avatar URL and IFC name are removed from the showcase list within 7 days of subscription cancellation.
          </Li>
        </Section>

        <Section title="6. Your Rights">
          <P>You have the right to:</P>
          <Li>Request a copy of the personal data we hold about you</Li>
          <Li>Request correction of inaccurate data</Li>
          <Li>Request deletion of your account and associated personal data</Li>
          <Li>Withdraw consent for optional data uses (e.g., subscriber showcase display)</Li>
          <P>
            To exercise any of these rights, email us at{' '}
            <Text as="span" color="orange.500" fontWeight="600">{CONTACT}</Text> with the subject line
            "Privacy Request". We will respond within 30 days.
          </P>
        </Section>

        <Section title="7. Cookies & Session Storage">
          <P>
            We use a single first-party HTTP-only cookie to maintain your authenticated session, managed
            by NextAuth.js. This cookie is strictly necessary for the platform to function and does not
            track you across other websites.
          </P>
          <P>
            We do not use advertising, analytics, or tracking cookies. No third-party cookies are set by
            our platform (Razorpay may set cookies within their payment modal — see Razorpay's policy).
          </P>
        </Section>

        <Section title="8. Security">
          <P>
            We implement industry-standard security measures including HTTPS encryption for all
            data in transit, HTTP-only session cookies, server-side authentication checks on all
            admin endpoints, and HMAC-SHA256 signature verification on all Razorpay webhooks.
          </P>
          <P>
            No system is completely secure. In the event of a data breach affecting your personal
            information, we will notify affected members via Discord or email within a reasonable
            timeframe.
          </P>
        </Section>

        <Section title="9. Children's Privacy">
          <P>
            The Crew Center is open to users aged 13 and above, consistent with Discord's minimum age
            requirement. We do not knowingly collect data from children under 13. If you believe a
            child under 13 has registered an account, contact us at{' '}
            <Text as="span" color="orange.500" fontWeight="600">{CONTACT}</Text> and we will remove
            the account promptly.
          </P>
        </Section>

        <Section title="10. Governing Law">
          <P>
            This policy is governed by the laws of India, including the Information Technology Act, 2000,
            the IT (Reasonable Security Practices) Rules, 2011, and the Digital Personal Data Protection
            Act, 2023. Any disputes shall be subject to the jurisdiction of courts in India.
          </P>
        </Section>

        <Section title="11. Changes to This Policy">
          <P>
            We may update this policy from time to time. The "Last updated" date at the top of this page
            reflects the most recent revision. Continued use of the platform after changes constitutes
            acceptance of the updated policy. For significant changes, we will post an announcement in
            our Discord server.
          </P>
        </Section>

        <Section title="12. Contact">
          <P>
            For privacy questions, data requests, or concerns, contact us at:
          </P>
          <Box
            bg="orange.50" border="1px solid" borderColor="orange.200"
            rounded="xl" p={5} mt={2}
          >
            <Text fontWeight="700" color="gray.800" fontSize="sm">Indian Virtual</Text>
            <Text color="orange.600" fontSize="sm" fontWeight="600">{CONTACT}</Text>
            <Text color="gray.500" fontSize="xs" mt={1}>{SITE}</Text>
          </Box>
        </Section>

      </Box>
    </Box>
  )
}
