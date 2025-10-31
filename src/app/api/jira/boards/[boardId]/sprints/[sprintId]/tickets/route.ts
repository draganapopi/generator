import { NextRequest, NextResponse } from 'next/server'
import { getJiraClient, isJiraConfigured } from '@/lib/jira-config'
import { mockTickets } from '@/lib/mock-tickets'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ boardId: string; sprintId: string }> }
) {
    try {
        const { boardId, sprintId } = await params

        if (!isJiraConfigured()) {
            // Return mock data for development
            return NextResponse.json({
                success: true,
                tickets: mockTickets.slice(0, 5), // Return subset of mock data
                total: mockTickets.length,
                source: 'mock'
            })
        }

        const jiraClient = await getJiraClient()
        if (!jiraClient) {
            return NextResponse.json({
                success: false,
                error: 'Failed to initialize Jira client'
            }, { status: 500 })
        }

        const result = await jiraClient.getSprintTickets(sprintId, boardId)

        return NextResponse.json({
            ...result,
            source: 'jira'
        })
    } catch (error) {
        console.error('Error fetching sprint tickets:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch sprint tickets',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}