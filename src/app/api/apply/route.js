// src/app/api/apply/route.js
import { NextResponse } from 'next/server';

// Securely checks the user's grade by calling the Infinite Flight API.
// The API key is read from server-side environment variables.
async function checkGrade(ifcUsername) {
    const apiKey = process.env.INFINITE_FLIGHT_API_KEY;
    if (!apiKey) {
        throw new Error('Infinite Flight API key is not configured on the server.');
    }

    try {
        const response = await fetch(
            `https://api.infiniteflight.com/public/v2/users?apikey=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discourseNames: [ ifcUsername ] }),
            }
        );

        if (!response.ok) {
            console.error('Infinite Flight API Error:', await response.text());
            throw new Error('Failed to fetch user data from Infinite Flight API.');
        }
        const data = await response.json();
        if (Array.isArray(data.result)) {
            const user = data.result.find(
                u => u.discourseUsername?.toLowerCase() === ifcUsername.toLowerCase()
            );
            return user ? user.grade >= 3 : false;
        }
        return false;

    } catch (error) {
        console.error('Error in checkGrade:', error);
        throw new Error('An error occurred while verifying your Infinite Flight grade.');
    }
}

// Securely sends a message to a Discord webhook.
// The webhook URL is a secret stored on the server.
async function sendToDiscord(webhookUrl, embed) {
    if (!webhookUrl) {
        throw new Error('Discord webhook URL is not configured on the server.');
    }
    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ embeds: [ embed ] }),
        });
        if (!response.ok) {
            console.error('Discord Webhook Error:', await response.text());
            throw new Error('Failed to send notification to Discord.');
        }
    } catch (error) {
        console.error('Error in sendToDiscord:', error);
        throw new Error('An error occurred while sending the notification.');
    }
}

// Main POST handler for the API route. It orchestrates the entire submission process.
export async function POST(request) {
    try {
        const body = await request.json();
        const { type, payload } = body;

        if (type === 'SUBMIT_APPLICATION') {
            const { formData } = payload;

            // Server-side validation for security and data integrity.
            if (!formData.firstName || !formData.lastName || !formData.ifcUsername || !formData.email || !formData.reason) {
                return NextResponse.json({ error: 'Incomplete form data. All fields are required.' }, { status: 400 });
            }

            const isGradeSufficient = await checkGrade(formData.ifcUsername);
            if (!isGradeSufficient) {
                return NextResponse.json({ error: 'Sorry, you are not at least Grade 3 in Infinite Flight.' }, { status: 403 });
            }

            const applicationEmbed = {
                title: 'New Application',
                color: 0x000000,
                fields: [
                    { name: 'IFC Username', value: `https://community.infiniteflight.com/u/${formData.ifcUsername}/summary`, inline: false },
                    { name: 'Reason to join', value: formData.reason, inline: false },
                ],
                timestamp: new Date().toISOString(),
            };

            await sendToDiscord(process.env.DISCORD_APP_WEBHOOK_URL, applicationEmbed);
            return NextResponse.json({ success: true });

        } else if (type === 'SUBMIT_TEST') {
            const { score, passed, applicantInfo } = payload;
            const resultEmbed = {
                title: 'New Written Test Result',
                color: passed ? 0x00ff00 : 0xff0000, // Green for pass, Red for fail
                fields: [
                    { name: 'IFC Username', value: `https://community.infiniteflight.com/u/${applicantInfo.ifcUsername}/summary`, inline: false },
                    { name: 'Reason to join', value: applicantInfo.reason, inline: false },
                ],
                timestamp: new Date().toISOString(),
            };

            await sendToDiscord(process.env.DISCORD_TEST_WEBHOOK_URL, resultEmbed);
            return NextResponse.json({ success: true });

        } else {
            return NextResponse.json({ error: 'Invalid request type.' }, { status: 400 });
        }
    } catch (error) {
        console.error('API Route Error:', error.message);
        return NextResponse.json({ error: error.message || 'An unexpected server error occurred.' }, { status: 500 });
    }
}