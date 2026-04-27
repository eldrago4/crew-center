import { useState, useEffect } from 'react';
import { Avatar, Spinner } from '@chakra-ui/react';

export function DiscordAvatar({ userId, size = 'md', ...props }) {
    const [ avatarUrl, setAvatarUrl ] = useState('');
    const [ isLoading, setIsLoading ] = useState(true);

    useEffect(() => {
        async function fetchAvatar() {
            if (!userId) {
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const res = await fetch(`/api/get-avatar?userId=${userId}`);
                const data = await res.json();

                if (data.error) {
                    console.error(data.error);
                    setAvatarUrl('');
                } else {
                    setAvatarUrl(data.avatarUrl || '');
                }
            } catch (error) {
                console.error('Fetch error:', error);
                setAvatarUrl('');
            } finally {
                setIsLoading(false);
            }
        }
        fetchAvatar();
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
