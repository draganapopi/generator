import { NextRequest, NextResponse } from 'next/server'
import { getJiraClient, isJiraConfigured } from '@/lib/jira-config'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ boardId: string }> }
) {
    try {
        const { boardId } = await params

        if (!isJiraConfigured()) {
            return NextResponse.json({
                success: false,
                error: 'Jira not configured'
            }, { status: 400 })
        }

        const jiraClient = await getJiraClient()
        if (!jiraClient) {
            return NextResponse.json({
                success: false,
                error: 'Failed to initialize Jira client'
            }, { status: 500 })
        }

        const result = await jiraClient.testBoardAccess(boardId)

        if (!result.success) {
            return NextResponse.json(result, { status: 500 })
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error('Error testing board access:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to test board access',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}