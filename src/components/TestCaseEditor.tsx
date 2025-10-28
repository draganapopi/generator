'use client'

import React, { useState } from 'react'
import { JiraTicket, TestCase, TestStep } from '@/types'

interface TestCaseEditorProps {
    ticket: JiraTicket;
    testCases: TestCase[];
    isGenerating: boolean;
    onApprove: (testCaseId: string) => void;
    onReject: (testCaseId: string) => void;
    onEdit: (testCase: TestCase) => void;
}

export function TestCaseEditor({
    ticket,
    testCases,
    isGenerating,
    onApprove,
    onReject,
    onEdit
}: TestCaseEditorProps) {
    const [editingTestCase, setEditingTestCase] = useState<string | null>(null)
    const [editedTestCase, setEditedTestCase] = useState<TestCase | null>(null)

    const handleEdit = (testCase: TestCase) => {
        setEditingTestCase(testCase.id)
        setEditedTestCase({ ...testCase })
    }

    const handleSaveEdit = () => {
        if (editedTestCase) {
            onEdit(editedTestCase)
            setEditingTestCase(null)
            setEditedTestCase(null)
        }
    }

    const handleCancelEdit = () => {
        setEditingTestCase(null)
        setEditedTestCase(null)
    }

    const updateEditedTestCase = (field: keyof TestCase, value: any) => {
        if (editedTestCase) {
            setEditedTestCase({
                ...editedTestCase,
                [field]: value
            })
        }
    }

    const updateStep = (stepIndex: number, field: keyof TestStep, value: string) => {
        if (editedTestCase) {
            const updatedSteps = [...editedTestCase.steps]
            updatedSteps[stepIndex] = {
                ...updatedSteps[stepIndex],
                [field]: value
            }
            setEditedTestCase({
                ...editedTestCase,
                steps: updatedSteps
            })
        }
    }

    const addStep = () => {
        if (editedTestCase) {
            const newStep: TestStep = {
                step: editedTestCase.steps.length + 1,
                action: '',
                expectedResult: ''
            }
            setEditedTestCase({
                ...editedTestCase,
                steps: [...editedTestCase.steps, newStep]
            })
        }
    }

    const removeStep = (stepIndex: number) => {
        if (editedTestCase) {
            const updatedSteps = editedTestCase.steps
                .filter((_, index) => index !== stepIndex)
                .map((step, index) => ({ ...step, step: index + 1 }))

            setEditedTestCase({
                ...editedTestCase,
                steps: updatedSteps
            })
        }
    }

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'approved':
                return 'bg-green-100 text-green-800 border-green-200'
            case 'rejected':
                return 'bg-red-100 text-red-800 border-red-200'
            case 'draft':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200'
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    if (isGenerating) {
        return (
            <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-700">Generating test cases...</p>
                <p className="text-sm text-gray-600 mt-2">
                    Analyzing ticket description and creating test scenarios
                </p>
            </div>
        )
    }

    if (testCases.length === 0) {
        return (
            <div className="p-8 text-center text-gray-700">
                <p>No test cases generated yet</p>
                <p className="text-sm mt-2 text-gray-600">
                    Test cases will appear here after selecting a ticket
                </p>
            </div>
        )
    }

    return (
        <div className="p-6 space-y-6">
            {testCases.map((testCase) => (
                <div key={testCase.id} className="border rounded-lg">
                    {/* Test Case Header */}
                    <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <h3 className="font-medium text-gray-900">{testCase.id}</h3>
                            <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(testCase.status)}`}>
                                {testCase.status || 'pending'}
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            {editingTestCase === testCase.id ? (
                                <>
                                    <button
                                        onClick={handleSaveEdit}
                                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                    >
                                        Save
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => handleEdit(testCase)}
                                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => onApprove(testCase.id)}
                                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                        disabled={testCase.status === 'approved'}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => onReject(testCase.id)}
                                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                        disabled={testCase.status === 'rejected'}
                                    >
                                        Reject
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Test Case Content */}
                    <div className="p-4 space-y-4">
                        {editingTestCase === testCase.id && editedTestCase ? (
                            <>
                                {/* Editable Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Title
                                    </label>
                                    <input
                                        type="text"
                                        value={editedTestCase.title}
                                        onChange={(e) => updateEditedTestCase('title', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder:text-gray-600"
                                        placeholder="Enter test case title"
                                    />
                                </div>

                                {/* Editable Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={editedTestCase.description}
                                        onChange={(e) => updateEditedTestCase('description', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder:text-gray-600"
                                        placeholder="Enter test case description"
                                    />
                                </div>

                                {/* Editable Preconditions */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Preconditions
                                    </label>
                                    <textarea
                                        value={editedTestCase.preconditions.join('\n')}
                                        onChange={(e) => updateEditedTestCase('preconditions', e.target.value.split('\n').filter(p => p.trim()))}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder:text-gray-600"
                                        placeholder="Enter each precondition on a new line"
                                    />
                                </div>

                                {/* Editable Steps */}
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Test Steps
                                        </label>
                                        <button
                                            onClick={addStep}
                                            className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                        >
                                            Add Step
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {editedTestCase.steps.map((step, index) => (
                                            <div key={index} className="border rounded-lg p-3 bg-gray-50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Step {step.step}
                                                    </span>
                                                    <button
                                                        onClick={() => removeStep(index)}
                                                        className="text-red-600 hover:text-red-800 text-sm"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>

                                                <div className="space-y-2">
                                                    <div>
                                                        <label className="block text-xs text-gray-700 mb-1">
                                                            Action
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={step.action}
                                                            onChange={(e) => updateStep(index, 'action', e.target.value)}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 placeholder:text-gray-600"
                                                            placeholder="Enter test step action"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs text-gray-700 mb-1">
                                                            Expected Result
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={step.expectedResult}
                                                            onChange={(e) => updateStep(index, 'expectedResult', e.target.value)}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 placeholder:text-gray-600"
                                                            placeholder="Enter expected result"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Read-only view */}
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">{testCase.title}</h4>
                                    <p className="text-gray-700 text-sm mb-4">{testCase.description}</p>
                                </div>

                                {/* Preconditions */}
                                <div>
                                    <h5 className="font-medium text-gray-900 mb-2">Preconditions:</h5>
                                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                        {testCase.preconditions.map((precondition, index) => (
                                            <li key={index}>{precondition}</li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Test Steps */}
                                <div>
                                    <h5 className="font-medium text-gray-900 mb-2">Test Steps:</h5>
                                    <div className="space-y-3">
                                        {testCase.steps.map((step, index) => (
                                            <div key={index} className="border-l-4 border-blue-200 pl-4">
                                                <div className="text-sm">
                                                    <span className="font-medium text-gray-900">
                                                        Step {step.step}:
                                                    </span>
                                                    <span className="ml-2 text-gray-700">{step.action}</span>
                                                </div>
                                                <div className="text-sm text-gray-700 mt-1">
                                                    <span className="font-medium">Expected:</span>
                                                    <span className="ml-2">{step.expectedResult}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Expected Result */}
                                <div>
                                    <h5 className="font-medium text-gray-900 mb-2">Overall Expected Result:</h5>
                                    <p className="text-sm text-gray-700">{testCase.expectedResult}</p>
                                </div>

                                {/* Metadata */}
                                <div className="flex items-center space-x-4 text-sm text-gray-700 pt-4 border-t">
                                    <span>Priority: {testCase.priority}</span>
                                    <span>Linked: {testCase.linkedTicket}</span>
                                    {testCase.labels.length > 0 && (
                                        <div className="flex items-center space-x-1">
                                            <span>Labels:</span>
                                            {testCase.labels.map((label, index) => (
                                                <span key={index} className="px-2 py-1 bg-gray-100 rounded text-xs">
                                                    {label}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}