const BASE = 'https://indianvirtual.com'

import { cacheLife } from 'next/cache'

// 'use cache' + max: without it, the per-entry `new Date()` counts as request-time
// data under Cache Components and turned the sitemap into a billed function
// invocation per crawler hit. Cached, it prerenders at build — lastModified becomes
// the deploy date, which is also more honest than "the moment you asked".
export default async function sitemap() {
    'use cache'
    cacheLife('max')
    return [
        {
            url: BASE,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1.0,
        },
        {
            url: `${BASE}/apply`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.9,
        },
        {
            url: `${BASE}/info`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${BASE}/ranks`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${BASE}/events`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
        },
        {
            url: `${BASE}/stats`,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        },
        {
            url: `${BASE}/live`,
            lastModified: new Date(),
            changeFrequency: 'always',
            priority: 0.6,
        },
        {
            url: `${BASE}/crew`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ]
}
