import localFont from 'next/font/local';
import Script from 'next/script';

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
        <html lang="en" className={horizon.variable}>
            <head>
                {/* Runs before hydration so the dark class is on <html> for the very first paint —
                    prevents the light-mode flash on every page load / hard navigation. */}
                <Script id="theme-init" strategy="beforeInteractive">
                    {`(function () {
                        try {
                            var mode = localStorage.getItem('chakra-ui-color-mode');
                            if (!mode) {
                                mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                            }
                            if (mode === 'dark') {
                                document.documentElement.classList.add('dark');
                            }
                        } catch (e) {}
                    })();`}
                </Script>
            </head>
            <body>
                {children}
            </body>
        </html>
    );
}
