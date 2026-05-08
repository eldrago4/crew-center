export const metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Indian Virtual — the rules and conditions governing use of the Crew Center platform.',
  alternates: { canonical: 'https://indianvirtual.site/terms' },
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
        color="blue.600"
        mb={4} pb={2}
        borderBottom="2px solid"
        borderColor="blue.100"
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
      <Box w="5px" h="5px" bg="blue.400" rounded="full" mt="8px" flexShrink={0} />
      <Text color="gray.700" lineHeight="1.8" fontSize="sm" flex={1}>{children}</Text>
    </Flex>
  )
}

function Callout({ children }) {
  return (
    <Box
      bg="blue.50" border="1px solid" borderColor="blue.200"
      rounded="xl" p={4} mt={1}
    >
      <Text color="blue.800" fontSize="sm" lineHeight="1.7">{children}</Text>
    </Box>
  )
}

export default function TermsPage() {
  return (
    <Box minH="100vh" bg="white">
      {/* Hero */}
      <Box
        bg="linear-gradient(135deg, #eff6ff 0%, #fff 50%, #fff7ed 100%)"
        borderBottom="1px solid" borderColor="blue.100"
        py={{ base: 14, md: 20 }}
      >
        <Box maxW="3xl" mx="auto" px={{ base: 5, md: 8 }}>
          <Box
            display="inline-flex" alignItems="center" gap={2}
            bg="blue.50" border="1px solid" borderColor="blue.200"
            px={3} py={1} rounded="full" mb={5}
          >
            <Box w="6px" h="6px" bg="blue.400" rounded="full" />
            <Text fontSize="xs" fontWeight="700" color="blue.600" letterSpacing="wider" textTransform="uppercase">
              Legal
            </Text>
          </Box>
          <Heading
            as="h1" size="2xl"
            fontFamily="'Playfair Display', serif"
            color="gray.900" mb={3} lineHeight="1.2"
          >
            Terms of Service
          </Heading>
          <Text color="gray.500" fontSize="sm">Last updated: {LAST_UPDATED}</Text>
          <Text color="gray.600" mt={4} fontSize="sm" lineHeight="1.7" maxW="xl">
            Please read these terms carefully before using the Indian Virtual Crew Center. By accessing
            or using our platform, you agree to be bound by these terms.
          </Text>
        </Box>
      </Box>

      {/* Body */}
      <Box maxW="3xl" mx="auto" px={{ base: 5, md: 8 }} py={{ base: 12, md: 16 }}>

        <Section title="1. Acceptance of Terms">
          <P>
            These Terms of Service ("Terms") govern your use of the Indian Virtual Crew Center, operated
            by Indian Virtual ("we", "us", "INVA") at {SITE}. By creating an account or using any part
            of the platform, you confirm that you have read, understood, and agree to these Terms and
            our Privacy Policy.
          </P>
          <P>
            If you do not agree to these Terms, you must not access or use the platform.
          </P>
        </Section>

        <Section title="2. Eligibility">
          <Li>You must be at least 13 years of age to use the Crew Center.</Li>
          <Li>You must hold an active Discord account in good standing, as Discord is required for authentication.</Li>
          <Li>You must be a member of the Indian Virtual Discord server or have been accepted as a crew member through our official recruitment process.</Li>
          <Li>You may hold only one Crew Center account per person.</Li>
          <Callout>
            Indian Virtual is a virtual aviation community for simulation purposes only. Joining does
            not constitute employment or any real-world aviation credential.
          </Callout>
        </Section>

        <Section title="3. Your Account">
          <P>
            Your account is created and authenticated via Discord OAuth. You are responsible for:
          </P>
          <Li>Maintaining the security of your Discord account</Li>
          <Li>All activity conducted under your Crew Center account</Li>
          <Li>Keeping your IFC (Infinite Flight Community) username accurate and up to date</Li>
          <P>
            You must not share your account with another person, create accounts on behalf of others,
            or impersonate any pilot or staff member.
          </P>
        </Section>

        <Section title="4. PIREP Submissions & Flight Records">
          <P>
            PIREPs (Pilot Reports) are the primary record of your virtual flying activity. By
            submitting a PIREP you confirm that:
          </P>
          <Li>The flight was completed by you in Infinite Flight within the rules of Indian Virtual</Li>
          <Li>All submitted data (flight time, route, aircraft) is accurate to the best of your knowledge</Li>
          <Li>You have not fabricated, duplicated, or materially misrepresented the flight</Li>
          <P>
            Submission of false or fraudulent PIREPs is grounds for immediate suspension. Approved
            PIREPs cannot be reversed except by a staff member in the event of an administrative error.
          </P>
        </Section>

        <Section title="5. Conduct & Community Rules">
          <P>You agree not to:</P>
          <Li>Harass, threaten, or abuse other members via the platform or Discord</Li>
          <Li>Attempt to access admin features, other pilots' data, or server infrastructure without authorisation</Li>
          <Li>Exploit bugs or vulnerabilities — report them to staff instead</Li>
          <Li>Use automated scripts, bots, or scrapers to access the Crew Center without prior written approval</Li>
          <Li>Attempt to manipulate rank, flight hours, or earnings through any means other than legitimate flights</Li>
          <P>
            Violations may result in suspension or permanent banning at staff discretion, with or without
            prior notice depending on severity.
          </P>
        </Section>

        <Section title="6. Voluntary Contributions (Chanda)">
          <P>
            The Crew Center offers a voluntary contributions feature ("Chanda") through which members
            may support INVA's infrastructure costs. By making a contribution, you acknowledge:
          </P>
          <Li>
            <Text as="span" fontWeight="600">Contributions are voluntary donations</Text>, not payments for goods or services. They do not
            entitle you to any specific benefit, privilege, or influence in INVA operations.
          </Li>
          <Li>
            All payments are processed by <Text as="span" fontWeight="600">Razorpay Software Private Limited</Text>. By completing a payment,
            you also agree to Razorpay's terms of service at{' '}
            <Text as="a" href="https://razorpay.com/terms/" target="_blank" rel="noopener noreferrer" color="blue.500" fontWeight="600">razorpay.com/terms</Text>.
          </Li>
          <Li>
            <Text as="span" fontWeight="600">Refunds:</Text> contributions are generally non-refundable as they are applied immediately to
            running infrastructure costs. In the event of a verified duplicate or erroneous charge,
            contact us at {CONTACT} within 7 days and we will process a refund via Razorpay.
          </Li>
          <Li>
            Contribution amounts are used solely to cover costs associated with running the Indian
            Virtual platform (domain, database, hosting, bot infrastructure). We do not profit from
            contributions.
          </Li>
        </Section>

        <Section title="7. Lotus Privé Subscription">
          <P>
            Lotus Privé is an optional recurring monthly subscription available to crew members. By
            subscribing, you agree to the following in addition to Section 6:
          </P>
          <Li>
            Subscriptions are billed at ₹199 per month via Razorpay's subscription service. The first
            payment is charged at the time of subscription activation.
          </Li>
          <Li>
            Benefits (such as a designated Discord role and appearance in the member showcase) are
            active for the duration of an active subscription and are removed within 7 days of
            cancellation or lapse.
          </Li>
          <Li>
            You may cancel your subscription at any time through Razorpay. Cancellation stops future
            billing; no partial-month refunds are issued.
          </Li>
          <Li>
            We reserve the right to modify the subscription price or benefits with 30 days' notice
            provided via a Discord announcement. Continued subscription after the notice period
            constitutes acceptance of the new terms.
          </Li>
          <Li>
            If a subscription payment fails (e.g., insufficient funds), Razorpay may retry the charge.
            Your Lotus Privé benefits will be suspended if the subscription enters a halted state.
          </Li>
          <Callout>
            Lotus Privé is a supporter programme — subscribing does not grant administrative authority,
            guaranteed approval of PIREPs, or any competitive advantage over other members.
          </Callout>
        </Section>

        <Section title="8. Intellectual Property">
          <P>
            All content on the Indian Virtual Crew Center — including the INVA name, logo, rank
            insignia, design, and code — is the property of Indian Virtual and its contributors.
            You may not reproduce, redistribute, or commercially use any of our content without
            prior written permission.
          </P>
          <P>
            Content you submit (PIREPs, comments) remains yours. By submitting it, you grant Indian
            Virtual a non-exclusive licence to store, display, and use it for the purposes of
            operating the platform.
          </P>
        </Section>

        <Section title="9. Disclaimers">
          <P>
            Indian Virtual is a <Text as="span" fontWeight="700" color="gray.900">simulation and community platform only</Text>. We are:
          </P>
          <Li>Not affiliated with, endorsed by, or connected to Air India, IndiGo, Vistara, or any real-world airline</Li>
          <Li>Not affiliated with Infinite Flight LLC or Navigraph</Li>
          <Li>Not a licensed aviation training organisation or regulatory body</Li>
          <P>
            The platform is provided "as is" without warranties of any kind, express or implied. We do
            not guarantee uninterrupted access, error-free operation, or permanent retention of your
            flight records.
          </P>
        </Section>

        <Section title="10. Limitation of Liability">
          <P>
            To the fullest extent permitted by applicable law, Indian Virtual shall not be liable for
            any indirect, incidental, special, or consequential damages arising from your use of the
            platform, including but not limited to loss of flight records, rank data, or contribution
            amounts due to technical failures.
          </P>
          <P>
            Our total liability to you for any claim arising out of these Terms shall not exceed the
            total amount you have contributed to INVA in the 90 days preceding the claim.
          </P>
        </Section>

        <Section title="11. Suspension & Termination">
          <P>
            We may suspend or terminate your account at any time if you violate these Terms, engage in
            conduct detrimental to the INVA community, or at our sole discretion for any reason.
          </P>
          <P>
            You may request deletion of your account at any time by contacting{' '}
            <Text as="span" color="blue.500" fontWeight="600">{CONTACT}</Text>. Upon deletion, your
            personally identifiable data will be removed in accordance with our Privacy Policy.
            Aggregate flight statistics may be retained in anonymised form.
          </P>
          <P>
            Termination does not entitle you to a refund of any contributions made.
          </P>
        </Section>

        <Section title="12. Modifications to the Service">
          <P>
            We reserve the right to modify, suspend, or discontinue any part of the Crew Center at any
            time. We will provide reasonable notice for significant changes where possible. We are not
            liable to you or any third party for any modification, suspension, or discontinuation.
          </P>
        </Section>

        <Section title="13. Governing Law & Dispute Resolution">
          <P>
            These Terms are governed by and construed in accordance with the laws of India. Any disputes
            arising out of or relating to these Terms or your use of the platform shall be subject to
            the exclusive jurisdiction of the competent courts of India.
          </P>
          <P>
            Before initiating any formal proceeding, you agree to first contact us at {CONTACT} to
            attempt to resolve the dispute informally within 30 days.
          </P>
        </Section>

        <Section title="14. Changes to These Terms">
          <P>
            We may update these Terms from time to time. The "Last updated" date at the top of this
            page indicates the most recent revision. Continued use of the platform after changes are
            posted constitutes your acceptance of the revised Terms. We will announce material changes
            in our Discord server.
          </P>
        </Section>

        <Section title="15. Contact">
          <P>For questions about these Terms, contact us at:</P>
          <Box
            bg="blue.50" border="1px solid" borderColor="blue.200"
            rounded="xl" p={5} mt={2}
          >
            <Text fontWeight="700" color="gray.800" fontSize="sm">Indian Virtual</Text>
            <Text color="blue.600" fontSize="sm" fontWeight="600">{CONTACT}</Text>
            <Text color="gray.500" fontSize="xs" mt={1}>{SITE}</Text>
          </Box>
        </Section>

      </Box>
    </Box>
  )
}
