import { NextResponse } from 'next/server'
import { getJiraClient, isJiraConfigured } from '@/lib/jira-config'
import { mockTickets } from '@/lib/test-case-generator'

export async function GET() {
    try {
        // If Jira is configured, try to get recent tickets
        if (isJiraConfigured()) {
            const jiraClient = await getJiraClient()
            if (jiraClient) {
                const jql = 'ORDER BY updated DESC'
                const result = await jiraClient.getTicketsByJQL(jql, 20)

                if (result.success) {
                    return NextResponse.json({
                        success: true,
                        tickets: result.tickets,
                        total: result.total,
                        source: 'jira'
                    })
                }
            }
        }

        // Fallback to mock data
        return NextResponse.json({
            success: true,
            tickets: mockTickets,
            total: mockTickets.length,
            source: 'mock'
        })
    } catch (error) {
        console.error('Error fetching tickets:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch tickets',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}