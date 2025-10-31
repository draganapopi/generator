import { NextRequest, NextResponse } from 'next/server'
import { getJiraClient, isJiraConfigured } from '@/lib/jira-config'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ boardId: string }> }
) {
    try {
        const { boardId } = await params
        const { searchParams } = new URL(request.url)
        const includeAll = searchParams.get('includeAll')

        if (!isJiraConfigured()) {
            return NextResponse.json({
                success: false,
                error: 'Jira not configured',
                sprints: []
            })
        }

        const jiraClient = await getJiraClient()
        if (!jiraClient) {
            return NextResponse.json({
                success: false,
                error: 'Failed to initialize Jira client',
                sprints: []
            }, { status: 500 })
        }

        const result = includeAll === 'true'
            ? await jiraClient.getAllSprints(boardId)
            : await jiraClient.getActiveSprints(boardId)

        if (!result.success) {
            return NextResponse.json({
                success: false,
                error: result.error || 'Failed to fetch sprints',
                sprints: []
            }, { status: 500 })
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error fetching sprints:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch sprints',
                sprints: []
            },
            { status: 500 }
        )
    }
}