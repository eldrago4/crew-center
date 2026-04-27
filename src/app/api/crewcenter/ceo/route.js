import { updateStaff } from '@/app/shared/users';

export async function POST(request) {
    try {
        const { moduleName, newValue } = await request.json();

        if (!moduleName || newValue === undefined) {
            return new Response(JSON.stringify({ error: 'Missing moduleName or newValue in request body.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        let result;
        switch (moduleName) {
            case 'staff':
                result = await updateStaff(newValue);
                break;
            default:
                return new Response(JSON.stringify({ error: `Unknown moduleName: ${moduleName}` }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' },
                });
        }

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error(`API Error:`, error);
        return new Response(JSON.stringify({ error: `Server error processing request.`, details: error.message || 'An unknown error occurred.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}