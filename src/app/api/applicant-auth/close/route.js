import { NextResponse } from 'next/server'

export async function GET() {
    const html = `<!DOCTYPE html>
<html>
<head><title>Authentication Successful</title></head>
<body>
<script>
  if (window.opener) {
    window.opener.postMessage('auth-success', '*');
  }
  window.close();
</script>
<p>Authentication successful. You may close this window.</p>
</body>
</html>`
    return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
    })
}
