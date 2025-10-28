'use client'

import React, { useState, useEffect } from 'react'
import { JiraTicket } from '@/types'

interface TicketListProps {
    onTicketSelect: (ticket: JiraTicket) => void;
    selectedTicket: JiraTicket | null;
    boardId?: number | null;
}

export function TicketList({ onTicketSelect, selectedTicket, boardId }: TicketListProps) {
    const [tickets, setTickets] = useState<JiraTicket[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState<string>('all')
    const [dataSource, setDataSource] = useState<'mock' | 'jira'>('mock')

    useEffect(() => {
        fetchTickets()
    }, [boardId])

    const fetchTickets = async () => {
        try {
            setLoading(true)
            setError(null)

            // Use board-specific endpoint if boardId is provided, otherwise use general endpoint
            const endpoint = boardId ? `/api/jira/boards/${boardId}/tickets` : '/api/tickets'
            const response = await fetch(endpoint)

            if (!response.ok) {
                throw new Error('Failed to fetch tickets')
            }

            const data = await response.json()
            setTickets(data.tickets || [])
            setDataSource(data.source || 'mock')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error')
            setTickets([])
        } finally {
            setLoading(false)
        }
    }

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = ticket.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.key.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesFilter = filterType === 'all' || ticket.issueType.toLowerCase() === filterType.toLowerCase()

        return matchesSearch && matchesFilter
    })

    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'highest':
            case 'critical':
                return 'bg-red-100 text-red-800'
            case 'high':
                return 'bg-orange-100 text-orange-800'
            case 'medium':
                return 'bg-yellow-100 text-yellow-800'
            case 'low':
            case 'lowest':
                return 'bg-green-100 text-green-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'to do':
            case 'open':
                return 'bg-blue-100 text-blue-800'
            case 'in progress':
                return 'bg-purple-100 text-purple-800'
            case 'done':
            case 'closed':
                return 'bg-green-100 text-green-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="mb-4 p-4 border rounded-lg">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800">Error loading tickets</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                            <button
                                onClick={fetchTickets}
                                className="mt-2 text-sm bg-red-100 hover:bg-red-200 px-3 py-1 rounded"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6">
            {/* Board Information Header */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-medium text-blue-900">Board {boardId ? `#${boardId}` : 'Tickets'}</h3>
                        <p className="text-sm text-blue-700">
                            Showing {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${dataSource === 'jira' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {dataSource === 'jira' ? 'Live Data' : 'Mock Data'}
                        </span>
                        <button
                            onClick={fetchTickets}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Refresh tickets"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="mb-6 space-y-4">
                <div>
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder:text-gray-600"
                    />
                </div>

                <div>
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                        style={{ color: '#666666' }}
                    >
                        <option value="all">All Types</option>
                        <option value="story">Story</option>
                        <option value="bug">Bug</option>
                        <option value="task">Task</option>
                        <option value="epic">Epic</option>
                    </select>
                </div>
            </div>

            {/* Tickets List */}
            <div className="space-y-3">
                {filteredTickets.length === 0 ? (
                    <div className="text-center py-8 text-gray-700">
                        <p>No tickets found</p>
                    </div>
                ) : (
                    filteredTickets.map((ticket) => (
                        <div
                            key={ticket.key}
                            onClick={() => onTicketSelect(ticket)}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${selectedTicket?.key === ticket.key ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className="font-medium text-blue-600">{ticket.key}</span>
                                        <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(ticket.priority)}`}>
                                            {ticket.priority}
                                        </span>
                                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(ticket.status)}`}>
                                            {ticket.status}
                                        </span>
                                    </div>

                                    <h3 className="text-sm font-medium text-gray-800 mb-1">
                                        {ticket.summary}
                                    </h3>

                                    <div className="flex items-center space-x-4 text-xs text-gray-700">
                                        <span>{ticket.issueType}</span>
                                        {ticket.assignee && <span>Assignee: {ticket.assignee}</span>}
                                    </div>

                                    {ticket.labels.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {ticket.labels.slice(0, 3).map((label, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded"
                                                >
                                                    {label}
                                                </span>
                                            ))}
                                            {ticket.labels.length > 3 && (
                                                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                                    +{ticket.labels.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}