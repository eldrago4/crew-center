export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    // The whole crew area, not a hand-maintained list of its
                    // sections — new /crew/* pages were shipping crawlable.
                    '/crew',
                    '/api/',
                    '/ifc-name',
                    '/maintenance',
                ],
            },
        ],
        sitemap: 'https://indianvirtual.com/sitemap.xml',
        host: 'https://indianvirtual.com',
    }
}
