import localFont from 'next/font/local';

const horizon = localFont({
    src: '../../public/Horizon.woff2',
    weight: '700',
    style: 'normal',
    variable: '--font-horizon',
    display: 'swap',
});

export const metadata = { title: 'Indian Virtual' };

export default function RootLayout({ children }) {
    return (
        // suppressHydrationWarning: the theme-init script below sets the `dark`
        // class on <html> before hydration, so the server markup intentionally
        // differs from the client. Without this, React throws hydration error #418.
        <html lang="en" className={horizon.variable} suppressHydrationWarning>
            <head>
                {/* A raw inline script, not next/script: with strategy="beforeInteractive"
                    Next never emitted a real tag here, it only serialised this into the RSC
                    payload and ran it after hydration. That put it *after* the (main)
                    layout's parse-time script, so the public site's attempt to clear `dark`
                    was immediately undone. This runs during parse and is the single source
                    of truth for colour mode. */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function () {
                            try {
                                var path = window.location.pathname;
                                var dark = false;
                                if (path === '/crew') {
                                    // Login is dark-only, whatever the visitor prefers.
                                    dark = true;
                                } else if (path.indexOf('/crew/') === 0) {
                                    // The crew app follows the OS, and stays toggleable.
                                    var mode = localStorage.getItem('chakra-ui-color-mode');
                                    if (!mode) {
                                        mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                                    }
                                    dark = mode === 'dark';
                                }
                                // Everything else — the public site — is always light.
                                var root = document.documentElement;
                                if (dark) { root.classList.add('dark'); }
                                else { root.classList.remove('dark'); }
                            } catch (e) {}
                        })();`,
                    }}
                />
            </head>
            <body>
                {children}
            </body>
        </html>
    );
}
