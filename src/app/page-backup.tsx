'use client'

import { useState, useEffect } from 'react'
import { TicketList } from '@/components/TicketList'
import { TestCaseEditor } from '@/components/TestCaseEditor'
import { Header } from '@/components/Header'
import { SprintSelector } from '@/components/SprintSelector'
import { JiraTicket, TestCase } from '@/types'

export default function Home() {
    const [selectedTicket, setSelectedTicket] = useState<JiraTicket | null>(null)
    const [generatedTestCases, setGeneratedTestCases] = useState<TestCase[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [selectedBoardId, setSelectedBoardId] = useState<number | null>(null)
    const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null)
    const [selectedSprintName, setSelectedSprintName] = useState<string>('')

    const handleSprintSelect = (boardId: number, sprintId: number, sprintName: string) => {
        setSelectedBoardId(boardId)
        setSelectedSprintId(sprintId)
        setSelectedSprintName(sprintName)
        // Reset selected ticket when sprint changes
        setSelectedTicket(null)
        setGeneratedTestCases([])
    }

    const handleTicketSelect = async (ticket: JiraTicket) => {
        setSelectedTicket(ticket)
        setIsGenerating(true)

        try {
            const response = await fetch(`/api/server/generate-test-cases`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ ticket }),
            })

            if (response.ok) {
                const testCases = await response.json()
                setGeneratedTestCases(testCases)
            }
        } catch (error) {
            console.error('Error generating test cases:', error)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleTestCaseApprove = (testCaseId: string) => {
        setGeneratedTestCases(prev =>
            prev.map(tc =>
                tc.id === testCaseId
                    ? { ...tc, status: 'approved' }
                    : tc
            )
        )
    }

    const handleTestCaseReject = (testCaseId: string) => {
        setGeneratedTestCases(prev =>
            prev.map(tc =>
                tc.id === testCaseId
                    ? { ...tc, status: 'rejected' }
                    : tc
            )
        )
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
                    {/* Left Panel - Sprint Selection & Ticket List */}
                    <div className="space-y-6">
                        {/* Sprint Selector */}
                        <div className="bg-white rounded-lg shadow-sm border">
                            <div className="p-6 border-b">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Sprint Selection
                                </h2>
                                <p className="text-gray-600 mt-1">
                                    Choose a board and sprint to view tickets
                                </p>
                            </div>
                            <div className="p-6">
                                <SprintSelector
                                    onSprintSelect={handleSprintSelect}
                                    isLoading={isGenerating}
                                />
                            </div>
                        </div>

                        {/* Ticket List */}
                        <div className="bg-white rounded-lg shadow-sm border">
                            <div className="p-6 border-b">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {selectedSprintName ? `${selectedSprintName} - Tickets` : 'Jira Tickets'}
                                </h2>
                                <p className="text-gray-600 mt-1">
                                    Select a ticket to generate test cases
                                </p>
                            </div>
                            <TicketList
                                onTicketSelect={handleTicketSelect}
                                selectedTicket={selectedTicket}
                                boardId={selectedBoardId}
                                sprintId={selectedSprintId}
                                sprintName={selectedSprintName}
                            />
                        </div>
                    </div>

                    {/* Right Panel - Test Case Editor */}
                    <div className="bg-white rounded-lg shadow-sm border">
                        <div className="p-6 border-b">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Test Cases
                            </h2>
                            {selectedTicket && (
                                <p className="text-gray-600 mt-1">
                                    Generated for: {selectedTicket.key} - {selectedTicket.summary}
                                </p>
                            )}
                        </div>

                        {selectedTicket ? (
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
                                <p>Select a ticket to view and edit test cases</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}