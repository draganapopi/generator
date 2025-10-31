import { NextRequest, NextResponse } from 'next/server'
import { getJiraClient, isJiraConfigured } from '@/lib/jira-config'
import { mockTickets } from '@/lib/mock-tickets'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ boardId: string }> }
) {
    try {
        const { boardId } = await params
        const { searchParams } = new URL(request.url)
        const activeOnly = searchParams.get('activeOnly')

        if (!isJiraConfigured()) {
            // Return mock data for development
            return NextResponse.json({
                success: true,
                tickets: mockTickets.slice(0, 10), // Return more mock data for board view
                total: mockTickets.length,
                source: 'mock'
            })
        }

        const jiraClient = await getJiraClient()
        if (!jiraClient) {
            return NextResponse.json({
                success: false,
                error: 'Jira client not available'
            }, { status: 500 })
        }

        const result = await jiraClient.getBoardTickets(boardId)

        return NextResponse.json({
            ...result,
            source: 'jira'
        })
    } catch (error) {
        console.error('Error in board tickets endpoint:', error)

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