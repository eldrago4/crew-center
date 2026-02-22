import { NextResponse } from 'next/server';
import { auth } from '../../../auth';
import crypto from 'crypto';

export async function GET() {
    const session = await auth();

    if (!session?.user?.callsign) {
        return NextResponse.redirect(new URL('/crew', process.env.NEXTAUTH_URL));
    }

    const secret = process.env.CAREER_SSO_SECRET;
    if (!secret) {
        return NextResponse.json({ error: 'SSO not configured' }, { status: 500 });
    }

    const payload = {
        callsign: session.user.callsign,
        discordId: session.user.discordId || null,
        permissions: session.user.permissions || [],
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60,
    };

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
        .createHmac('sha256', secret)
        .update(`${header}.${body}`)
        .digest('base64url');

    const token = `${header}.${body}.${signature}`;

    return NextResponse.redirect(`https://career.indianvirtual.site/sso?token=${token}`);
}
