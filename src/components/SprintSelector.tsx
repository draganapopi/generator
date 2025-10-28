'use client'

import React, { useState, useEffect } from 'react'

interface Board {
    id: number;
    name: string;
    type: string;
    projectKey?: string;
}

interface Sprint {
    id: number;
    name: string;
    state: string;
    startDate?: string;
    endDate?: string;
    goal?: string;
}

interface SprintSelectorProps {
    onSprintSelect: (boardId: number, sprintId: number, sprintName: string) => void;
    isLoading?: boolean;
}

export function SprintSelector({ onSprintSelect, isLoading }: SprintSelectorProps) {
    const [boards, setBoards] = useState<Board[]>([])
    const [sprints, setSprints] = useState<Sprint[]>([])
    const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null)
    const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null)
    const [loadingBoards, setLoadingBoards] = useState(false)
    const [loadingSprints, setLoadingSprints] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [jiraConfigured, setJiraConfigured] = useState(true)

    useEffect(() => {
        fetchBoards()
    }, [])

    const fetchBoards = async () => {
        try {
            setLoadingBoards(true)
            setError(null)

            const response = await fetch('/api/server/jira/boards')
            const data = await response.json()

            if (data.success) {
                setBoards(data.boards || [])
                setJiraConfigured(true)
            } else {
                setError(data.error || 'Failed to fetch boards')
                setJiraConfigured(false)
            }
        } catch (err) {
            setError('Failed to connect to API')
            setJiraConfigured(false)
        } finally {
            setLoadingBoards(false)
        }
    }

    const fetchSprints = async (boardId: number) => {
        try {
            setLoadingSprints(true)
            setError(null)

            const response = await fetch(`/api/server/jira/boards/${boardId}/sprints?includeAll=true`)
            const data = await response.json()

            if (data.success) {
                setSprints(data.sprints || [])
            } else {
                setError(data.error || 'Failed to fetch sprints')
                setSprints([])
            }
        } catch (err) {
            setError('Failed to fetch sprints')
            setSprints([])
        } finally {
            setLoadingSprints(false)
        }
    }

    const handleBoardChange = (boardId: string) => {
        const id = parseInt(boardId)
        setSelectedBoardId(id)
        setSelectedSprintId(null)
        setSprints([])

        if (id) {
            fetchSprints(id)
        }
    }

    const handleSprintChange = (sprintId: string) => {
        const id = parseInt(sprintId)
        setSelectedSprintId(id)

        if (id && selectedBoardId) {
            const sprint = sprints.find(s => s.id === id)
            onSprintSelect(selectedBoardId, id, sprint?.name || '')
        }
    }

    const getSprintStatusColor = (state: string) => {
        switch (state.toLowerCase()) {
            case 'active':
                return 'bg-green-100 text-green-800'
            case 'future':
                return 'bg-blue-100 text-blue-800'
            case 'closed':
                return 'bg-gray-100 text-gray-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const testConnection = async () => {
        try {
            const response = await fetch('/api/server/jira/test-connection')
            const data = await response.json()

            if (data.success) {
                setJiraConfigured(true)
                setError(null)
                fetchBoards()
            } else {
                setError(data.error)
                setJiraConfigured(false)
            }
        } catch (err) {
            setError('Failed to test connection')
            setJiraConfigured(false)
        }
    }

    if (!jiraConfigured) {
        return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.332 15.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <h3 className="font-medium text-yellow-800">Jira Not Configured</h3>
                </div>
                <p className="text-sm text-yellow-700 mb-3">
                    Please configure your Jira connection to fetch real sprint data.
                </p>
                <button
                    onClick={testConnection}
                    className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm"
                >
                    Test Connection
                </button>
                {error && (
                    <p className="text-sm text-red-600 mt-2">{error}</p>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Jira Board
                </label>
                <select
                    value={selectedBoardId || ''}
                    onChange={(e) => handleBoardChange(e.target.value)}
                    disabled={loadingBoards || isLoading}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                >
                    <option value="">Choose a board...</option>
                    {boards.map((board) => (
                        <option key={board.id} value={board.id}>
                            {board.name} {board.projectKey && `(${board.projectKey})`}
                        </option>
                    ))}
                </select>
                {loadingBoards && (
                    <p className="text-sm text-gray-500 mt-1">Loading boards...</p>
                )}
            </div>

            {selectedBoardId && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Sprint
                    </label>
                    <select
                        value={selectedSprintId || ''}
                        onChange={(e) => handleSprintChange(e.target.value)}
                        disabled={loadingSprints || isLoading}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                        <option value="">Choose a sprint...</option>
                        {sprints.map((sprint) => (
                            <option key={sprint.id} value={sprint.id}>
                                {sprint.name}
                            </option>
                        ))}
                    </select>
                    {loadingSprints && (
                        <p className="text-sm text-gray-500 mt-1">Loading sprints...</p>
                    )}

                    {sprints.length > 0 && (
                        <div className="mt-3 space-y-2">
                            <p className="text-sm font-medium text-gray-700">Available Sprints:</p>
                            <div className="space-y-1">
                                {sprints.slice(0, 5).map((sprint) => (
                                    <div key={sprint.id} className="flex items-center justify-between text-sm">
                                        <span className="truncate">{sprint.name}</span>
                                        <span className={`px-2 py-1 rounded-full text-xs ${getSprintStatusColor(sprint.state)}`}>
                                            {sprint.state}
                                        </span>
                                    </div>
                                ))}
                                {sprints.length > 5 && (
                                    <p className="text-xs text-gray-500">
                                        +{sprints.length - 5} more sprints available
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                    <button
                        onClick={() => selectedBoardId ? fetchSprints(selectedBoardId) : fetchBoards()}
                        className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                    >
                        Try again
                    </button>
                </div>
            )}
        </div>
    )
}