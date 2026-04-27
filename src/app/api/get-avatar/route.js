import { NextResponse } from 'next/server';

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
            return NextResponse.json({
                avatarUrl: defaultAvatarUrl,
                hasCustomAvatar: false
            });
        }

        // Check if animated (GIF)
        const extension = avatar.startsWith('a_') ? 'gif' : 'png';
        const avatarUrl = `https://cdn.discordapp.com/avatars/${id}/${avatar}.${extension}?size=128`;

        return NextResponse.json({
            userId: id,
            avatarHash: avatar,
            hasCustomAvatar: true,
            avatarUrl
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
