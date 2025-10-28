import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        console.log('=== Next.js API: Generating test cases ===');
        console.log('Request body:', body?.ticket ? `${body.ticket.key}: ${body.ticket.summary}` : 'No ticket data');
        console.log('Backend URL:', BACKEND_URL);

        // Forward request to Express.js backend
        const backendResponse = await fetch(`${BACKEND_URL}/api/generate-test-cases`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })

        console.log('Backend response status:', backendResponse.status);

        if (!backendResponse.ok) {
            console.error('Backend error response:', await backendResponse.text());
            throw new Error(`Backend responded with status: ${backendResponse.status}`)
        }

        const data = await backendResponse.json()
        console.log('Backend returned', Array.isArray(data) ? data.length : 'non-array', 'test cases');

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error generating test cases:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to generate test cases',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}