import { NextResponse } from 'next/server';
import { getDummyData } from '@/app/shared/users';

export async function POST(request) {
    try {
        const { callsign } = await request.json();
        if (!callsign) {
            return NextResponse.json({ valid: false, error: 'No callsign provided' }, { status: 400 });
        }
        const dummyData = await getDummyData();
        const matched = dummyData.find(
            (entry) => entry.callsign === callsign
        );
        if (matched) {
            return NextResponse.json({ valid: true });
        } else {
            return NextResponse.json({ valid: false });
        }
    } catch (e) {
        return NextResponse.json({ valid: false, error: e.message }, { status: 500 });
    }
}
