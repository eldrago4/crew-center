export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: [
                    '/crew/dashboard',
                    '/crew/pireps/',
                    '/crew/admin/',
                    '/crew/plan/',
                    '/crew/gates/',
                    '/crew/community/',
                    '/crew/resources/',
                    '/crew/routes',
                    '/crew/career',
                    '/api/',
                    '/ifc-name',
                    '/maintenance',
                ],
            },
        ],
        sitemap: 'https://indianvirtual.site/sitemap.xml',
        host: 'https://indianvirtual.site',
    }
}
