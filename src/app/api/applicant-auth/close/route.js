import { NextResponse } from 'next/server';

export async function GET() {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Auth Success</title>
</head>
<body>
    <script>
        if (window.opener) {
            window.opener.postMessage('auth-success', '*');
        }
        window.close();
    </script>
</body>
</html>
    `;
    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
    });
}
