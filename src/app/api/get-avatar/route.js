import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const AVATAR_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;

function avatarResponse(payload, status = 200) {
    return NextResponse.json(payload, {
        status,
        headers: {
            'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400',
        },
    });
}

function getRedis() {
    try {
        return Redis.fromEnv();
    } catch {
        return null;
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || searchParams.get('discordId');

    if (!userId) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
    if (!DISCORD_BOT_TOKEN) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    try {
        const cacheKey = `discord:avatar:${userId}`;
        const redis = getRedis();
        const cached = await redis?.get(cacheKey).catch(() => null);
        if (cached) {
            const payload = typeof cached === 'string' ? JSON.parse(cached) : cached;
            return avatarResponse(payload);
        }

        const response = await fetch(`https://discord.com/api/v10/users/${userId}`, {
            headers: {
                Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
            },
        });

        if (!response.ok) {
            return NextResponse.json({
                error: 'Failed to fetch Discord user data',
                details: await response.text()
            }, { status: response.status });
        }

        const userData = await response.json();
        const { avatar, id, discriminator } = userData;

        if (!avatar) {
            // Handle default avatar
            const defaultAvatarUrl = `https://cdn.discordapp.com/embed/avatars/${discriminator % 5}.png`;
            const payload = {
                userId: id,
                avatarUrl: defaultAvatarUrl,
                hasCustomAvatar: false
            };
            await redis?.set(cacheKey, JSON.stringify(payload), { ex: AVATAR_CACHE_TTL_SECONDS }).catch(() => {});
            return avatarResponse(payload);
        }

        // Check if animated (GIF)
        const extension = avatar.startsWith('a_') ? 'gif' : 'png';
        const avatarUrl = `https://cdn.discordapp.com/avatars/${id}/${avatar}.${extension}?size=128`;

        const payload = {
            userId: id,
            avatarHash: avatar,
            hasCustomAvatar: true,
            avatarUrl
        };
        await redis?.set(cacheKey, JSON.stringify(payload), { ex: AVATAR_CACHE_TTL_SECONDS }).catch(() => {});

        return avatarResponse(payload);

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
