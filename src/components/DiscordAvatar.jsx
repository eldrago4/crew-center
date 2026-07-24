import { useState, useEffect } from 'react';
import { Avatar, Spinner } from '@chakra-ui/react';

// Client-side avatar cache. The /api/get-avatar route already caches in Redis,
// but the browser was still re-fetching on every mount — and the AI.g chat
// renders one <DiscordAvatar> per user message, so a short conversation fired
// the endpoint many times. We cache resolved URLs here:
//   • memCache  — instant reuse within the session (survives remounts)
//   • localStorage — survives reloads/navigations, TTL 24h
//   • inflight  — collapses concurrent misses for the same user onto one fetch
const AVATAR_TTL_MS = 24 * 60 * 60 * 1000;
const memCache = new Map(); // userId -> url ('' means "known to have none")
const inflight = new Map(); // userId -> Promise<url>

function readStored(userId) {
    try {
        const raw = localStorage.getItem(`aig:avatar:${userId}`);
        if (!raw) return null;
        const { url, at } = JSON.parse(raw);
        if (Date.now() - at > AVATAR_TTL_MS) return null;
        return url || '';
    } catch {
        return null;
    }
}

function writeStored(userId, url) {
    try {
        localStorage.setItem(`aig:avatar:${userId}`, JSON.stringify({ url, at: Date.now() }));
    } catch {
        /* storage full / disabled — memCache still covers the session */
    }
}

async function loadAvatar(userId) {
    if (memCache.has(userId)) return memCache.get(userId);

    const stored = readStored(userId);
    if (stored !== null) {
        memCache.set(userId, stored);
        return stored;
    }

    if (inflight.has(userId)) return inflight.get(userId);

    const promise = (async () => {
        try {
            const res = await fetch(`/api/get-avatar?userId=${userId}`);
            const data = await res.json();
            const url = data?.error ? '' : data.avatarUrl || '';
            memCache.set(userId, url);
            writeStored(userId, url);
            return url;
        } catch (error) {
            console.error('Fetch error:', error);
            return '';
        } finally {
            inflight.delete(userId);
        }
    })();

    inflight.set(userId, promise);
    return promise;
}

export function DiscordAvatar({ userId, size = 'md', ...props }) {
    const [ avatarUrl, setAvatarUrl ] = useState(() => (userId && memCache.get(userId)) || '');
    const [ isLoading, setIsLoading ] = useState(() => Boolean(userId) && !memCache.has(userId));

    useEffect(() => {
        let active = true;

        if (!userId) {
            setAvatarUrl('');
            setIsLoading(false);
            return;
        }

        if (memCache.has(userId)) {
            setAvatarUrl(memCache.get(userId) || '');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        loadAvatar(userId).then((url) => {
            if (!active) return;
            setAvatarUrl(url || '');
            setIsLoading(false);
        });

        return () => {
            active = false;
        };
    }, [ userId ]);

    if (isLoading) {
        return <Spinner size="sm" />;
    }

    return (
        <Avatar.Root size={size} {...props}>
            <Avatar.Image src={avatarUrl} />
            <Avatar.Fallback name="" />
        </Avatar.Root>
    );
}
