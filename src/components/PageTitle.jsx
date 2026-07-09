'use client';

import { Heading } from '@chakra-ui/react';

// Bold, condensed, all-caps page title used at the top of every crew-center
// page (Logbook, Leaderboard, Events, ...) for a heavy "horizon"-style look.
const PageTitle = ({ children, as = 'h1', ...rest }) => (
  <Heading
    as={as}
    textTransform="uppercase"
    fontFamily="'Montserrat', sans-serif"
    fontWeight="900"
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
