import { NextRequest, NextResponse } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ boardId: string }> }
) {
    try {
        const { boardId } = await params

        // Forward request to Express.js backend
        const backendResponse = await fetch(`${BACKEND_URL}/api/jira/boards/${boardId}/tickets`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!backendResponse.ok) {
            throw new Error(`Backend responded with status: ${backendResponse.status}`)
        }

        const data = await backendResponse.json()

        return NextResponse.json(data)
    } catch (error) {
        console.error('Error fetching board tickets:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch board tickets',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}