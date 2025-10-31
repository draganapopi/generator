'use client'

import { useState, useEffect } from 'react'
import { TicketList } from '@/components/TicketList'
import { TestCaseEditor } from '@/components/TestCaseEditor'
import { Header } from '@/components/Header'
import { JiraTicket, TestCase } from '@/types'

export default function Home() {
    const [selectedTicket, setSelectedTicket] = useState<JiraTicket | null>(null)
    const [generatedTestCases, setGeneratedTestCases] = useState<TestCase[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    // Derive set of tickets whose test cases are ALL finalized (approved or rejected) from persisted storage
    const computeFinalizedTickets = (): Set<string> => {
        const result = new Set<string>()
        if (typeof window === 'undefined') return result
        try {
            const rawGenerated = localStorage.getItem(TEST_CASES_KEY)
            if (!rawGenerated) return result
            const parsed: { [ticketKey: string]: TestCase[] } = JSON.parse(rawGenerated)
            Object.entries(parsed).forEach(([ticketKey, cases]) => {
                if (cases.length > 0 && cases.every(c => c.status === 'approved' || c.status === 'rejected')) {
                    result.add(ticketKey)
                }
            })
        } catch {
            // ignore
        }
        return result
    }

    const [finalizedTickets, setFinalizedTickets] = useState<Set<string>>(() => computeFinalizedTickets())
    const computeGeneratedTickets = (): Set<string> => {
        const set = new Set<string>()
        if (typeof window === 'undefined') return set
        try {
            const raw = localStorage.getItem(TEST_CASES_KEY)
            if (!raw) return set
            const parsed: { [ticketKey: string]: TestCase[] } = JSON.parse(raw)
            Object.entries(parsed).forEach(([k, cases]) => {
                if (cases.length > 0) set.add(k)
            })
        } catch { /* ignore */ }
        return set
    }
    const [generatedTickets, setGeneratedTickets] = useState<Set<string>>(() => computeGeneratedTickets())

    // Recompute when generatedTestCases change (affects selected ticket) or on mount
    useEffect(() => {
        setFinalizedTickets(computeFinalizedTickets())
        setGeneratedTickets(computeGeneratedTickets())
    }, [generatedTestCases])
    // Removed ticket locking: generation always allowed; approved/rejected cases persist visually.
    // Persist test case statuses (approved/rejected) across reloads using localStorage until backend endpoint exists.
    // Structure: localStorage key 'testCaseStatuses' -> JSON { [ticketKey]: { [testCaseId]: 'approved' | 'rejected' } }

    const STORAGE_KEY = 'testCaseStatuses'
    const TEST_CASES_KEY = 'generatedTestCases'

    interface PersistedStatuses {
        [ticketKey: string]: { [testCaseId: string]: 'approved' | 'rejected' }
    }

    interface PersistedGeneratedTestCases {
        [ticketKey: string]: TestCase[]
    }

    const loadPersistedStatuses = (): PersistedStatuses => {
        if (typeof window === 'undefined') return {}
        try {
            const raw = localStorage.getItem(STORAGE_KEY)
            return raw ? JSON.parse(raw) : {}
        } catch {
            return {}
        }
    }

    const savePersistedStatuses = (data: PersistedStatuses) => {
        if (typeof window === 'undefined') return
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        } catch {
            // ignore
        }
    }

    const loadPersistedGenerated = (): PersistedGeneratedTestCases => {
        if (typeof window === 'undefined') return {}
        try {
            const raw = localStorage.getItem(TEST_CASES_KEY)
            return raw ? JSON.parse(raw) : {}
        } catch {
            return {}
        }
    }

    const savePersistedGenerated = (data: PersistedGeneratedTestCases) => {
        if (typeof window === 'undefined') return
        try {
            localStorage.setItem(TEST_CASES_KEY, JSON.stringify(data))
        } catch {
            // ignore
        }
    }

    // When selecting a ticket, load its persisted statuses and apply to existing generated cases (if any kept)
    useEffect(() => {
        if (!selectedTicket) return
        const persisted = loadPersistedStatuses()[selectedTicket.key] || {}
        if (Object.keys(persisted).length === 0) return
        setGeneratedTestCases(prev => prev.map(tc => (
            persisted[tc.id] ? { ...tc, status: persisted[tc.id] } : tc
        )))
    }, [selectedTicket])

    const handleTicketSelect = (ticket: JiraTicket) => {
        setSelectedTicket(ticket)
        setError(null)
        // Load persisted generated test cases for this ticket if available
        const persistedGenerated = loadPersistedGenerated()[ticket.key]
        if (persistedGenerated && Array.isArray(persistedGenerated)) {
            // Apply persisted statuses as a safety (in case they changed separately)
            const statuses = loadPersistedStatuses()[ticket.key] || {}
            const withStatuses = persistedGenerated.map(tc => (
                statuses[tc.id] ? { ...tc, status: statuses[tc.id] } : tc
            ))
            setGeneratedTestCases(withStatuses)
        } else {
            setGeneratedTestCases([])
        }
    }

    const handleGenerate = async () => {
        if (!selectedTicket) return
        setIsGenerating(true)
        setError(null)
        try {
            const response = await fetch(`/api/show-test-cases`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ticket: selectedTicket })
            })
            if (!response.ok) {
                const data = await response.json().catch(() => null)
                throw new Error(data?.error || 'Failed to generate test cases')
            }
            const newGenerated: TestCase[] = await response.json()
            setGeneratedTestCases(prev => {
                // Preserve existing approved/rejected cases; replace pending/draft with new ones
                const finalizedIds = new Set(prev.filter(tc => tc.status === 'approved' || tc.status === 'rejected').map(tc => tc.id))
                const finalized = prev.filter(tc => finalizedIds.has(tc.id))
                // Avoid duplicates: skip new ones whose id already approved/rejected
                const incoming = newGenerated.filter(tc => !finalizedIds.has(tc.id))

                // Apply persisted statuses for this ticket (if any) to incoming test cases
                const persisted = selectedTicket ? loadPersistedStatuses()[selectedTicket.key] || {} : {}
                const incomingWithStatus = incoming.map(tc => {
                    const persistedStatus = persisted[tc.id]
                    if (persistedStatus === 'approved' || persistedStatus === 'rejected') {
                        return { ...tc, status: persistedStatus }
                    }
                    return tc
                })

                return [...finalized, ...incomingWithStatus]
            })
            // After generation, merge with persisted and save
            if (selectedTicket) {
                setTimeout(() => {
                    const all = loadPersistedGenerated()
                    all[selectedTicket.key] = (function (current: TestCase[]) {
                        // Save the just-updated state (can't rely on closure `generatedTestCases` yet)
                        return current
                    })(
                        // We'll read from state after React flush using another microtask
                        []
                    )
                }, 0)
            }
        } catch (e) {
            console.error('Error generating test cases:', e)
            setError(e instanceof Error ? e.message : 'Unknown error')
        } finally {
            setIsGenerating(false)
        }
    }

    // Effect: whenever generatedTestCases change for a selected ticket, persist them
    useEffect(() => {
        if (!selectedTicket) return
        const all = loadPersistedGenerated()
        all[selectedTicket.key] = generatedTestCases
        savePersistedGenerated(all)
    }, [generatedTestCases, selectedTicket])

    const handleTestCaseApprove = (testCaseId: string) => {
        setGeneratedTestCases(prev => {
            const updated = prev.map(tc => tc.id === testCaseId ? { ...tc, status: 'approved' as TestCase['status'] } : tc)
            // Persist
            if (selectedTicket) {
                const all = loadPersistedStatuses()
                all[selectedTicket.key] = all[selectedTicket.key] || {}
                all[selectedTicket.key][testCaseId] = 'approved'
                savePersistedStatuses(all)
            }
            return updated
        })
    }

    const handleTestCaseReject = (testCaseId: string) => {
        setGeneratedTestCases(prev => {
            const updated = prev.map(tc => tc.id === testCaseId ? { ...tc, status: 'rejected' as TestCase['status'] } : tc)
            if (selectedTicket) {
                const all = loadPersistedStatuses()
                all[selectedTicket.key] = all[selectedTicket.key] || {}
                all[selectedTicket.key][testCaseId] = 'rejected'
                savePersistedStatuses(all)
            }
            return updated
        })
    }

    const handleTestCaseEdit = (updatedTestCase: TestCase) => {
        setGeneratedTestCases(prev =>
            prev.map(tc =>
                tc.id === updatedTestCase.id
                    ? updatedTestCase
                    : tc
            )
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Panel - Ticket List */}
                    <div className="bg-white rounded-lg shadow-sm border">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Jira Tickets (Board 28)
                            </h2>
                            <p className="text-gray-600 mt-1">
                                Select a ticket to generate test cases
                            </p>
                        </div>
                        <TicketList
                            onTicketSelect={handleTicketSelect}
                            selectedTicket={selectedTicket}
                            boardId={28}
                            finalizedTickets={finalizedTickets}
                            generatedTickets={generatedTickets}
                        />
                    </div>

                    {/* Right Panel - Test Case Editor */}
                    <div className="bg-white rounded-lg shadow-sm border">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Test Cases
                            </h2>
                            {selectedTicket && (
                                <div className="mt-2 space-y-2">
                                    <p className="text-gray-600 flex items-center gap-2 flex-wrap">
                                        <span>Selected: {selectedTicket.key} - {selectedTicket.summary}</span>
                                        {finalizedTickets.has(selectedTicket.key) && (
                                            <span className="px-2 py-0.5 text-xs rounded-full bg-green-600 text-white" title="All test cases for this ticket are finalized (approved or rejected)">
                                                TESTS FINALIZED
                                            </span>
                                        )}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        {generatedTestCases.length === 0 && (
                                            <button
                                                onClick={handleGenerate}
                                                disabled={isGenerating}
                                                className="px-4 py-2 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isGenerating ? 'Generating...' : 'Generate Test Cases'}
                                            </button>
                                        )}
                                        {generatedTestCases.length > 0 && (
                                            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                                                {generatedTestCases.length} case{generatedTestCases.length !== 1 ? 's' : ''} generated
                                            </span>
                                        )}
                                        {/* Generate button hidden after first successful generation */}
                                    </div>
                                    {error && (
                                        <div className="text-xs text-red-600 bg-red-50 border border-red-200 rounded p-2">
                                            {error}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {selectedTicket ? (
                            generatedTestCases.length > 0 ? (
                                <TestCaseEditor
                                    ticket={selectedTicket}
                                    testCases={generatedTestCases}
                                    isGenerating={isGenerating}
                                    onApprove={handleTestCaseApprove}
                                    onReject={handleTestCaseReject}
                                    onEdit={handleTestCaseEdit}
                                />
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    {isGenerating ? (
                                        <p>Generating test cases...</p>
                                    ) : (
                                        <p>Click "Generate Test Cases" to create test cases for this ticket.</p>
                                    )}
                                </div>
                            )
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                <p>Select a ticket to enable generation</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}