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
        <html lang="en" className={horizon.variable}>
            <head />
            <body>
                {children}
            </body>
        </html>
    );
}
