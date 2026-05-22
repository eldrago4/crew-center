export const metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Indian Virtual — the rules and conditions governing use of the Crew Center platform.',
  alternates: { canonical: 'https://indianvirtual.site/terms' },
}

import { Box, Heading, Text, VStack, Flex } from '@chakra-ui/react'

const LAST_UPDATED = 'May 9, 2026'
const CONTACT = 'ceo@indianvirtual.site'
const SITE = 'https://indianvirtual.site'

function Section({ title, children }) {
  return (
    <Box mb={8}>
      <Heading as="h2" fontSize="15px" fontWeight="700" color="#111" mb={3} letterSpacing="-0.01em">
        {title}
      </Heading>
      <VStack align="stretch" gap={2.5}>
        {children}
      </VStack>
    </Box>
  )
}

function P({ children }) {
  return <Text fontSize="14px" color="#444" lineHeight="1.8">{children}</Text>
}

function Li({ children }) {
  return (
    <Flex gap={3} align="flex-start" pl={2}>
      <Text fontSize="14px" color="#999" mt="1px" flexShrink={0}>—</Text>
      <Text fontSize="14px" color="#444" lineHeight="1.8" flex={1}>{children}</Text>
    </Flex>
  )
}

function A({ href, children }) {
  return (
    <Text as="a" href={href} target="_blank" rel="noopener noreferrer"
      color="#2563eb" textDecoration="underline" textUnderlineOffset="3px"
      _hover={{ color: '#1d4ed8' }}>
      {children}
    </Text>
  )
}

function Strong({ children }) {
  return <Text as="span" fontWeight="600" color="#222">{children}</Text>
}

function Note({ children }) {
  return (
    <Box bg="#f9fafb" border="1px solid #e5e7eb" rounded="md" px={4} py={3} mt={1}>
      <Text fontSize="13px" color="#555" lineHeight="1.7">{children}</Text>
    </Box>
  )
}

export default function TermsPage() {
  return (
    <Box bg="white" minH="100vh">
      <Box maxW="680px" mx="auto" px={{ base: 5, md: 8 }} pt={{ base: 14, md: 20 }} pb={24}>

        {/* Header */}
        <Box mb={10} pb={8} borderBottom="1px solid #e5e7eb">
          <Text fontSize="12px" fontWeight="600" color="#9ca3af" letterSpacing="0.1em" textTransform="uppercase" mb={3}>
            Indian Virtual · Legal
          </Text>
          <Heading as="h1" fontSize={{ base: '28px', md: '36px' }} fontWeight="800" color="#111" letterSpacing="-0.03em" lineHeight="1.15" mb={3}>
            Terms of Service
          </Heading>
          <Text fontSize="13px" color="#9ca3af">Last updated: {LAST_UPDATED}</Text>
        </Box>

        {/* Intro */}
        <Box mb={10}>
          <P>
            These Terms of Service govern your use of the Indian Virtual Crew Center at{' '}
            <A href={SITE}>{SITE}</A>. By creating an account or using the platform, you confirm
            that you have read and agree to these terms and our{' '}
            <A href="/privacy">Privacy Policy</A>.
          </P>
        </Box>

        <Section title="1. Who We Are">
          <P>
            Indian Virtual ("INVA", "we", "us") is an informal virtual airline community operating
            within the Infinite Flight flight simulation platform. We are not a registered legal entity
            and are not affiliated with any real-world airline, Infinite Flight LLC, or Navigraph.
          </P>
        </Section>

        <Section title="2. Eligibility">
          <Li>You must be at least 13 years old to use the platform.</Li>
          <Li>You must hold an active Discord account, as Discord is required for authentication.</Li>
          <Li>You must be an accepted member of Indian Virtual through our official recruitment process.</Li>
          <Li>You may hold only one account per person.</Li>
          <Note>
            Joining Indian Virtual does not constitute employment, any real-world aviation credential,
            or any affiliation with a real-world airline.
          </Note>
        </Section>

        <Section title="3. Your Account">
          <P>
            Your account is linked to your Discord identity via OAuth. You are responsible for all
            activity under your account and for keeping your IFC (Infinite Flight Community) username
            accurate. You must not share your account, create accounts on behalf of others, or
            impersonate any member or staff.
          </P>
        </Section>

        <Section title="4. PIREP Submissions">
          <P>
            PIREPs (Pilot Reports) are the record of your virtual flying activity. By submitting a
            PIREP you confirm that:
          </P>
          <Li>The flight was completed by you in Infinite Flight under Indian Virtual's rules</Li>
          <Li>All submitted data — flight time, route, aircraft — is accurate</Li>
          <Li>You have not fabricated, duplicated, or materially misrepresented the flight</Li>
          <P>
            Submission of false or fraudulent PIREPs is grounds for immediate suspension. Approved
            PIREPs cannot be reversed except by a staff member correcting an administrative error.
          </P>
        </Section>

        <Section title="5. Conduct">
          <P>You agree not to:</P>
          <Li>Harass, threaten, or abuse other members via the platform or Discord</Li>
          <Li>Attempt to access admin features, other pilots' data, or server infrastructure without authorisation</Li>
          <Li>Exploit bugs or vulnerabilities — report them to staff at <A href={`mailto:${CONTACT}`}>{CONTACT}</A></Li>
          <Li>Use automated scripts or scrapers to access the platform without prior written approval</Li>
          <Li>Manipulate rank, flight hours, or earnings through any means other than legitimate flights</Li>
          <P>
            Violations may result in suspension or permanent removal at staff discretion, with or
            without prior notice depending on severity.
          </P>
        </Section>

        <Section title="6. Voluntary Contributions">
          <P>
            The Crew Center offers a voluntary contributions feature through which members may support
            INVA's infrastructure costs. By contributing, you acknowledge:
          </P>
          <Li>
            <Strong>Contributions are voluntary donations</Strong>, not payments for goods or services.
            They do not entitle you to any specific benefit, privilege, or influence in INVA operations.
          </Li>
          <Li>
            Payments are made manually through UPI. By tapping the confirmation button, you confirm
            that your UPI app showed the payment as successful.
          </Li>
          <Li>
            <Strong>Refunds:</Strong> contributions are generally non-refundable as they are applied
            immediately to running costs. In the event of a verified duplicate or erroneous charge,
            contact <A href={`mailto:${CONTACT}`}>{CONTACT}</A> within 7 days and we will review it manually.
          </Li>
          <Li>
            Contribution amounts are used solely to cover the domain, database, hosting, and bot
            infrastructure costs of running the platform. We do not profit from contributions.
          </Li>
        </Section>

        <Section title="7. Lotus Privé Pledge">
          <P>
            Lotus Privé is an optional monthly supporter pledge. By joining, you agree to the
            following in addition to Section 6:
          </P>
          <Li>Lotus Privé is limited to 4 active members and is renewed manually at ₹190 per month through UPI.</Li>
          <Li>Benefits such as a designated Discord role and appearance in the member showcase are active only while the current month's pledge is marked paid.</Li>
          <Li>Members get a first-week grace period each month. If the pledge remains unpaid after that window, the membership slot is freed and Discord roles may be revoked.</Li>
          <Li>You can stop participating simply by not renewing for the next month; no partial-month refunds are issued.</Li>
          <Li>We reserve the right to modify the price, seat count, or benefits with notice via a Discord announcement.</Li>
          <Note>
            Lotus Privé is a supporter programme. It does not grant administrative authority,
            guaranteed PIREP approval, or any competitive advantage over other members.
          </Note>
        </Section>

        <Section title="8. Intellectual Property">
          <P>
            All content on the Crew Center — including the INVA name, logo, rank insignia, design,
            and code — belongs to Indian Virtual and its contributors. You may not reproduce,
            redistribute, or commercially use any of it without prior written permission.
          </P>
          <P>
            Content you submit (PIREPs, comments) remains yours. By submitting it, you grant Indian
            Virtual a non-exclusive licence to store, display, and use it solely for operating the platform.
          </P>
        </Section>

        <Section title="9. Disclaimer of Warranties">
          <P>
            The platform is provided "as is" without warranties of any kind, express or implied. We do
            not guarantee uninterrupted access, error-free operation, or permanent retention of flight
            records. Indian Virtual is a simulation-only platform and is:
          </P>
          <Li>Not affiliated with Air India, IndiGo, Vistara, or any real-world airline</Li>
          <Li>Not affiliated with Infinite Flight LLC or Navigraph</Li>
          <Li>Not a licensed aviation training organisation or regulatory body</Li>
        </Section>

        <Section title="10. Limitation of Liability">
          <P>
            To the fullest extent permitted by applicable law, Indian Virtual shall not be liable for
            any indirect, incidental, or consequential damages arising from use of the platform,
            including loss of flight records or rank data due to technical failures. Our total
            liability for any claim shall not exceed the total amount you have contributed to INVA
            in the 90 days preceding the claim.
          </P>
        </Section>

        <Section title="11. Suspension & Termination">
          <P>
            We may suspend or terminate your account at any time for violation of these Terms or
            conduct detrimental to the INVA community. You may request account deletion at any time
            by emailing <A href={`mailto:${CONTACT}`}>{CONTACT}</A>. Termination does not entitle
            you to a refund of any contributions made.
          </P>
        </Section>

        <Section title="12. Modifications">
          <P>
            We reserve the right to modify, suspend, or discontinue any part of the platform at any
            time. We will provide reasonable notice for significant changes where possible. Continued
            use after changes constitutes acceptance of the revised Terms.
          </P>
        </Section>

        <Section title="13. Governing Law">
          <P>
            These Terms are governed by the laws of India. Any disputes shall be subject to the
            exclusive jurisdiction of the competent courts of India. Before initiating any formal
            proceeding, contact us at <A href={`mailto:${CONTACT}`}>{CONTACT}</A> to attempt
            informal resolution within 30 days.
          </P>
        </Section>

        <Section title="14. Contact">
          <P>
            For questions about these Terms:{' '}
            <A href={`mailto:${CONTACT}`}>{CONTACT}</A>
          </P>
        </Section>

        {/* Footer rule */}
        <Box mt={14} pt={6} borderTop="1px solid #e5e7eb">
          <Text fontSize="12px" color="#9ca3af">
            Indian Virtual · <A href="/privacy">Privacy Policy</A> · <A href={`mailto:${CONTACT}`}>{CONTACT}</A>
          </Text>
        </Box>

      </Box>
    </Box>
  )
}
