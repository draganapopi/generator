import { NextRequest, NextResponse } from 'next/server'
import { generateTestCases } from '@/lib/test-case-generator'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        console.log('=== Next.js API: Generating test cases ===');
        console.log('Request body:', body?.ticket ? `${body.ticket.key}: ${body.ticket.summary}` : 'No ticket data');

        if (!body.ticket) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Ticket data is required'
                },
                { status: 400 }
            )
        }

        console.log(`🎯 GENERATING TEST CASES FOR: ${body.ticket.key}`);
        console.log(`📝 Summary: ${body.ticket.summary}`);
        console.log(`🔧 Type: ${body.ticket.issueType}`);

        const testCases = generateTestCases(body.ticket);

        console.log(`✅ Generated ${testCases.length} test case(s) for ${body.ticket.key}`);

        return NextResponse.json(testCases)
    } catch (error) {
        console.error('❌ Error generating test cases:', error)

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