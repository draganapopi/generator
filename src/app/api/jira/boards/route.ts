import { NextResponse } from 'next/server'
import { getJiraClient, isJiraConfigured } from '@/lib/jira-config'

export async function GET() {
    try {
        if (!isJiraConfigured()) {
            return NextResponse.json({
                success: false,
                error: 'Jira not configured',
                boards: []
            })
        }

        const jiraClient = await getJiraClient()
        if (!jiraClient) {
            return NextResponse.json({
                success: false,
                error: 'Failed to initialize Jira client',
                boards: []
            }, { status: 500 })
        }

        const result = await jiraClient.getBoards()

        if (!result.success) {
            return NextResponse.json({
                success: false,
                error: result.error || 'Failed to fetch boards',
                boards: []
            }, { status: 500 })
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error fetching boards:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch boards',
                boards: []
            },
            { status: 500 }
        )
    }
}