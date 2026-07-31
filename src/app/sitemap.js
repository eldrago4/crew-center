const BASE = 'https://indianvirtual.com'

import { cacheLife } from 'next/cache'

// Public marketing surface only — everything under /crew is behind auth and is
// noindex'd by (crew)/crew/layout.jsx, so it must never appear here. Listing a
// noindex URL in a sitemap is what earns the "Submitted URL marked noindex"
// error in Search Console.
const ROUTES = [
    ['', 'weekly', 1.0],
    ['/apply', 'monthly', 0.9],
    ['/career', 'monthly', 0.9],
    ['/info', 'monthly', 0.8],
    ['/ranks', 'monthly', 0.8],
    ['/fleet', 'monthly', 0.8],
    ['/hubs', 'monthly', 0.8],
    ['/operations/routes', 'weekly', 0.8],
    ['/operations/trails', 'weekly', 0.7],
    ['/events', 'daily', 0.7],
    ['/stats', 'weekly', 0.7],
    ['/briefings', 'weekly', 0.6],
    ['/live', 'always', 0.6],
    ['/privacy', 'yearly', 0.3],
    ['/terms', 'yearly', 0.3],
]

// 'use cache' + max: without it, the per-entry `new Date()` counts as request-time
// data under Cache Components and turned the sitemap into a billed function
// invocation per crawler hit. Cached, it prerenders at build — lastModified becomes
// the deploy date, which is also more honest than "the moment you asked".
export default async function sitemap() {
    'use cache'
    cacheLife('max')

    const lastModified = new Date()

    return ROUTES.map(([path, changeFrequency, priority]) => ({
        url: `${BASE}${path}`,
        lastModified,
        changeFrequency,
        priority,
    }))
}
