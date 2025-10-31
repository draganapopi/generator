import { NextRequest, NextResponse } from 'next/server'
import { getJiraClient, isJiraConfigured } from '@/lib/jira-config'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { jql, maxResults = 50 } = body

        if (!jql) {
            return NextResponse.json({
                success: false,
                error: 'JQL query is required'
            }, { status: 400 })
        }

        if (!isJiraConfigured()) {
            return NextResponse.json({
                success: false,
                error: 'Jira not configured',
                tickets: []
            })
        }

        const jiraClient = await getJiraClient()
        if (!jiraClient) {
            return NextResponse.json({
                success: false,
                error: 'Failed to initialize Jira client'
            }, { status: 500 })
        }

        const result = await jiraClient.getTicketsByJQL(jql, maxResults)

        if (!result.success) {
            return NextResponse.json({
                success: false,
                error: result.error || 'Failed to search tickets',
                tickets: []
            }, { status: 500 })
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error searching tickets:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to search tickets',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}