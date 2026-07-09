'use client';

import { Heading } from '@chakra-ui/react';

// Bold, all-caps page title used at the top of every crew-center page
// (Logbook, Leaderboard, Events, ...), set in the Horizon display font.
const PageTitle = ({ children, as = 'h1', ...rest }) => (
  <Heading
    as={as}
    textTransform="uppercase"
    fontFamily="var(--font-horizon), sans-serif"
    fontWeight="700"
    letterSpacing="0.03em"
    fontSize={{ base: '2xl', md: '3xl' }}
    lineHeight={1.1}
    color="#9e0b1f"
    mb={{ base: 4, md: 6 }}
    {...rest}
  >
    {children}
  </Heading>
);

export default PageTitle;
