'use client';

import { forwardRef } from 'react';
import NextLink from 'next/link';

/**
 * next/link with prefetching disabled — use it for links that point at /crew routes.
 *
 * Every crew route is dynamic (it reads the auth cookie), so Next only holds a
 * prefetch for ~30s before re-fetching, and each prefetch is a full server render
 * billed as an invocation. Links that sit in the viewport therefore re-prefetch on a
 * loop. The worst offenders were the sidebar (present on every page) and the routes
 * table, which renders a "File" and an "FPL" button per row — 15 rows a page, each
 * with a unique query string, so 30 distinct dynamic prefetches per view. Together
 * they drove ~950 invocations per 12h each on /crew/pireps/file and
 * /crew/plan/simbrief, several times the real page-view count.
 *
 * This must be a wrapper component rather than `<Button as={NextLink} prefetch={false}>`:
 * Chakra's styled factory strips unknown non-DOM props, so `prefetch` never reached
 * next/link and prefetching silently continued (verified by rendering Chakra's Button
 * with a probe component — the prop was absent). Setting it inside the component keeps
 * it out of Chakra's hands.
 *
 * Public marketing pages are prerendered and CDN-served, so prefetching those costs
 * nothing — keep using plain next/link there.
 */
const NoPrefetchLink = forwardRef(function NoPrefetchLink(props, ref) {
  return <NextLink ref={ref} {...props} prefetch={false} />;
});

export default NoPrefetchLink;
