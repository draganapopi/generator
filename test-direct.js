// Direct test of the ContentAwareParser class
class ContentAwareParser {
    parseTicketContent(description, summary, issueType) {
        if (!description) return null;

        const analysisResult = {
            userStory: this.extractUserStory(description),
            acceptanceCriteria: this.extractAcceptanceCriteria(description),
            technicalNotes: this.extractTechnicalNotes(description),
            dataRequirements: this.extractDataRequirements(description),
            businessRules: this.extractBusinessRules(description),
            scenarios: []
        };

        // First try to find Gherkin-style scenarios
        analysisResult.scenarios = this.generateScenariosFromContent(description, summary, issueType);
        console.log(`Gherkin scenarios found: ${analysisResult.scenarios.length}`);

        // If no scenarios found, try to parse non-Gherkin requirements
        if (analysisResult.scenarios.length === 0) {
            console.log('No Gherkin scenarios found, trying non-Gherkin parsing...');
            analysisResult.scenarios = this.generateScenariosFromRequirements(description, summary, issueType);
            console.log(`Non-Gherkin scenarios generated: ${analysisResult.scenarios.length}`);
        }

        return analysisResult;
    }

    extractUserStory(description) {
        const lines = description.split('\n').map(line => line.trim());
        let userRole = null;
        let goal = null;
        let benefit = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Extract role from "as" statements - support more variations
            if (line.match(/^\*?as\*?\s/i) || line.match(/^\*?as a\*?\s/i)) {
                userRole = line.replace(/^\*?(as\s?a?)\*?\s/i, '').replace(/\*/g, '').trim();
            }

            // Extract goal from "i want to" statements
            if (line.match(/^\*?i want to\*?\s/i)) {
                goal = line.replace(/^\*?i want to\*?\s/i, '').replace(/\*/g, '').trim();
            }

            // Extract benefit from "so that" statements
            if (line.match(/^\*?so that\*?\s/i)) {
                benefit = line.replace(/^\*?so that\*?\s/i, '').replace(/\*/g, '').trim();
            }

            // Also handle "and" continuation for benefit
            if (line.match(/^\*?and\*?\s/i) && benefit && !goal) {
                benefit += ' ' + line.replace(/^\*?and\*?\s/i, '').replace(/\*/g, '').trim();
            }
        }

        return { userRole, goal, benefit };
    }

    extractAcceptanceCriteria(description) {
        const criteria = [];
        const lines = description.split('\n').map(line => line.trim());

        let inCriteriaSection = false;
        let currentList = [];

        for (const line of lines) {
            // Detect acceptance criteria sections - more patterns
            if (line.toLowerCase().includes('technical notes') ||
                line.toLowerCase().includes('tech notes')) {
                inCriteriaSection = true;
                continue;
            }

            // Extract bullet points in criteria sections - more patterns
            if (inCriteriaSection && (
                line.startsWith('* ') ||
                line.startsWith('- ') ||
                line.match(/^\d+\./) ||
                line.startsWith('• ')
            )) {
                let cleanLine = line.replace(/^[*\-\d\.\•]\s*/, '').trim();

                if (cleanLine) {
                    currentList.push(cleanLine);
                }
            }
        }

        if (currentList.length > 0) {
            criteria.push(...currentList);
        }

        return criteria;
    }

    extractTechnicalNotes(description) {
        const notes = [];
        const lines = description.split('\n').map(line => line.trim());

        let inTechSection = false;

        for (const line of lines) {
            if (line.toLowerCase().includes('tech notes') || line.toLowerCase().includes('technical notes')) {
                inTechSection = true;
                continue;
            }

            if (inTechSection && line.startsWith('* ')) {
                notes.push(line.replace(/^\*\s*/, '').trim());
            }

            // Stop if we hit another section
            if (inTechSection && line.startsWith('[^')) {
                break;
            }
        }

        return notes;
    }

    extractDataRequirements(description) {
        return [];
    }

    extractBusinessRules(description) {
        return [];
    }

    generateScenariosFromContent(description, summary, issueType) {
        const userStory = this.extractUserStory(description);
        const acceptanceCriteria = this.extractAcceptanceCriteria(description);
        const technicalNotes = this.extractTechnicalNotes(description);

        const scenarios = [];

        // Check if we have user story format (Type 1 and Type 2)
        const hasUserStoryFormat = userStory.userRole && userStory.goal;

        console.log('Scenario analysis:', {
            hasUserRole: !!userStory.userRole,
            hasGoal: !!userStory.goal,
            hasBenefit: !!userStory.benefit,
            hasUserStoryFormat
        });

        // Type 1: Has user story format but NO explicit gherkin scenarios
        if (hasUserStoryFormat) {
            console.log('Processing Type 1: User story without explicit Gherkin scenarios');

            // Main functional scenario based on user story
            scenarios.push({
                title: `User can ${userStory.goal}`,
                userRole: userStory.userRole || 'user',
                type: 'functional',
                preconditions: this.generatePreconditions(userStory, issueType),
                steps: this.generateStepsFromGoal(userStory.goal, acceptanceCriteria),
                acceptanceCriteria: acceptanceCriteria
            });

            // Technical implementation scenarios
            if (technicalNotes.length > 0) {
                scenarios.push({
                    title: 'Technical implementation works correctly',
                    userRole: 'system',
                    type: 'technical',
                    preconditions: ['System is properly configured', 'All integrations are available'],
                    steps: this.generateTechnicalSteps(technicalNotes),
                    acceptanceCriteria: technicalNotes
                });
            }
        }

        return scenarios;
    }

    generateScenariosFromRequirements(description, summary, issueType) {
        return [];
    }

    generatePreconditions(userStory, issueType) {
        const preconditions = [];

        // Use more standard precondition format
        preconditions.push('User is logged in into system');

        // Enhanced preconditions based on goal content
        if (userStory.goal && userStory.goal.includes('cancelled')) {
            preconditions.push('User is opening cancel order');
        } else if (userStory.goal && userStory.goal.includes('order')) {
            preconditions.push('Test orders are available in the system');
        }

        return preconditions;
    }

    generateStepsFromGoal(goal, acceptanceCriteria) {
        const steps = [];
        let stepNumber = 1;

        // Enhanced goal analysis with more specific patterns

        // Pattern for "see a card" or similar UI visibility goals
        if (goal.includes('see a card') || goal.includes('see card') || goal.includes('show card')) {
            const cardType = this.extractCardType(goal);

            steps.push({
                step: stepNumber++,
                action: 'User navigates to the page',
                expectedResult: 'User is on the page'
            });

            // Determine the specific area to check based on context
            if (goal.includes('communication history') || goal.includes('history') || acceptanceCriteria.some(c => c.includes('history'))) {
                steps.push({
                    step: stepNumber++,
                    action: 'User clicks on the Order Activity',
                    expectedResult: 'Tab Order Activity is opened'
                });
            }

            steps.push({
                step: stepNumber++,
                action: `User checks if ${cardType} is displayed`,
                expectedResult: `${cardType} is shown`
            });

            // Check design compliance if it's a visual component
            steps.push({
                step: stepNumber++,
                action: 'Check if card is according to design',
                expectedResult: 'Card is according to design'
            });

            return steps;
        }

        // Pattern for general viewing/seeing goals
        if (goal.includes('see') || goal.includes('view') || goal.includes('overview') || goal.includes('list')) {
            steps.push({
                step: stepNumber++,
                action: 'Navigate to the relevant section where the information should be displayed',
                expectedResult: 'User can access the viewing area successfully'
            });

            steps.push({
                step: stepNumber++,
                action: 'Request or load the information that needs to be viewed',
                expectedResult: 'System displays the requested information clearly and completely'
            });
        }

        // Add steps based on acceptance criteria
        acceptanceCriteria.forEach((criteria, index) => {
            steps.push({
                step: stepNumber++,
                action: `Verify that ${criteria.toLowerCase()}`,
                expectedResult: `${criteria} is correctly implemented and visible`
            });
        });

        if (steps.length === 0) {
            // Generic fallback
            steps.push({
                step: 1,
                action: 'Perform the main action described in the user story goal',
                expectedResult: 'Action completes successfully according to acceptance criteria'
            });
        }

        return steps;
    }

    // Helper method to extract card type from goal
    extractCardType(goal) {
        if (goal.includes('cancelled') || goal.includes('cancel')) {
            return 'card for Cancel order';
        }
        if (goal.includes('order')) {
            return 'card for order';
        }
        if (goal.includes('card mentioning')) {
            const match = goal.match(/card mentioning that (.+?)(?:\s|$)/);
            if (match) {
                return `card mentioning that ${match[1]}`;
            }
        }
        return 'card';
    }

    generateTechnicalSteps(technicalNotes) {
        return technicalNotes.map((note, index) => ({
            step: index + 1,
            action: `Verify that ${note.toLowerCase().replace(/^(for now|take a note)/, 'system')}`,
            expectedResult: `Technical requirement "${note}" is properly implemented`
        }));
    }
}

// Enhanced test case generator with real content analysis
function generateTestCases(ticket) {
    console.log(`\n=== Generating test cases for ${ticket.key} ===`);
    console.log('Ticket description:', ticket.description ? ticket.description.substring(0, 200) + '...' : 'NO DESCRIPTION');
    console.log('Ticket summary:', ticket.summary);
    console.log('Issue type:', ticket.issueType);

    const contentParser = new ContentAwareParser();
    const analysis = contentParser.parseTicketContent(ticket.description, ticket.summary, ticket.issueType);

    console.log('Analysis result:', {
        hasUserStory: !!analysis?.userStory?.userRole,
        scenariosCount: analysis?.scenarios?.length || 0,
        hasCriteria: analysis?.acceptanceCriteria?.length || 0,
        hasTechnicalNotes: analysis?.technicalNotes?.length || 0
    });

    if (!analysis || analysis.scenarios.length === 0) {
        console.log('Using fallback test case generation (no scenarios found)');
        return [];
    }

    const testCases = [];

    analysis.scenarios.forEach((scenario, index) => {
        testCases.push({
            id: `${ticket.key}-TC-${String(index + 1).padStart(3, '0')}`,
            title: scenario.title,
            description: `Test case for ${ticket.issueType} ${ticket.key}: ${scenario.title}`,
            userRole: scenario.userRole,
            testType: scenario.type,
            userStory: analysis.userStory,
            preconditions: scenario.preconditions,
            steps: scenario.steps,
            acceptanceCriteria: scenario.acceptanceCriteria || [],
            expectedResult: scenario.steps.length > 0
                ? scenario.steps[scenario.steps.length - 1].expectedResult
                : 'All acceptance criteria are met',
            priority: ticket.priority,
            labels: [
                ...ticket.labels,
                `${scenario.type}-test`,
                ticket.issueType.toLowerCase(),
                `role-${scenario.userRole}`
            ],
            linkedTicket: ticket.key,
            status: 'pending',
            assignee: ticket.assignee,
            components: ticket.components,
            // Additional metadata from ticket analysis
            technicalNotes: analysis.technicalNotes,
            dataRequirements: analysis.dataRequirements,
            businessRules: analysis.businessRules
        });
    });

    return testCases;
}

// Test the ticket
const testTicket = {
    "key": "MTO-1884",
    "summary": "[MTO][CH] Non-MVP - Cancelled orders should include a card on communication history",
    "description": "*as* prepress\n\n*i want to* see a card mentioning that an order is cancelled\n\n*so that* it's clear and part of the entire history\n\n!image-20250924-104242.png|width=342,alt=\"image-20250924-104242.png\"!\n\nTechnical notes:\n\n* Should be as text history item card",
    "issueType": "Story",
    "priority": "Medium",
    "status": "In Review",
    "assignee": "Uros Jovic",
    "labels": [],
    "components": []
};

const testCases = generateTestCases(testTicket);
console.log('\n=== GENERATED TEST CASES ===');
console.log(JSON.stringify(testCases, null, 2));