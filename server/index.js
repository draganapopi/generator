const express = require('express');
const cors = require('cors');
const path = require('path');
const { JiraClient } = require('./jira-client');
const { JIRA_CONFIG, isJiraConfigured } = require('./jira-config');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Jira client if configured
let jiraClient = null;
if (isJiraConfigured()) {
    jiraClient = new JiraClient(JIRA_CONFIG);
    console.log('Jira client initialized with URL:', JIRA_CONFIG.url);
} else {
    console.warn('Jira not configured - using mock data. Set JIRA_URL, JIRA_EMAIL, and JIRA_TOKEN environment variables.');
}

// Middleware
app.use(cors());
app.use(express.json());

// Mock data for development
const mockTickets = [
    {
        key: 'MTO-1842',
        summary: '[MTO][Prepress Backoffice] Non-MVP - Saved filters for prepress seniors',
        description: `Feature: Saved filters for prepress seniors

As a prepress senior
I want to save my frequently used filters
So that I can quickly apply them without reconfiguring each time

Background:
Given I am logged in as a prepress senior
And I have access to the prepress backoffice system

Scenario: Save a new filter
Given I am on the filter configuration page
When I configure search criteria with specific parameters
And I click "Save Filter" button
And I enter a filter name "My Daily Tasks"
Then the filter should be saved successfully
And I should see "Filter saved successfully" message
And the filter should appear in my saved filters list

Scenario: Apply saved filter
Given I have at least one saved filter named "My Daily Tasks"
When I navigate to the main prepress page
And I select "My Daily Tasks" from saved filters dropdown
Then the filter should be applied automatically
And I should see only tasks matching the saved criteria
And the filter name should be displayed as active`,
        issueType: 'Story',
        priority: 'Medium',
        status: 'To Do',
        assignee: 'John Doe',
        labels: ['prepress', 'backoffice', 'filters'],
        components: ['Prepress Module'],
        customFields: {}
    },
    {
        key: 'MTO-1843',
        summary: '[MTO][Frontend] Fix responsive layout issues on mobile devices',
        description: `Bug: Mobile layout breaks on small screens

Steps to reproduce:
1. Open the application on mobile device
2. Navigate to dashboard
3. Observe layout issues

Expected: Layout should be responsive
Actual: Elements overflow and break layout`,
        issueType: 'Bug',
        priority: 'High',
        status: 'In Progress',
        assignee: 'Jane Smith',
        labels: ['frontend', 'mobile', 'responsive'],
        components: ['Frontend'],
        customFields: {}
    },
    {
        key: 'MTO-1844',
        summary: '[MTO][API] Implement user authentication endpoints',
        description: `Task: Create authentication API endpoints

As a backend developer
I want to implement secure authentication endpoints
So that users can safely log in and access protected resources

Acceptance Criteria:
* POST /auth/login endpoint accepts email and password, returns JWT token
* POST /auth/logout endpoint invalidates the user session
* POST /auth/refresh endpoint refreshes expired tokens with valid refresh token
* GET /auth/profile endpoint returns current user information for authenticated users
* All endpoints include proper error handling and status codes
* Rate limiting is implemented to prevent brute force attacks
* Input validation prevents injection attacks
* Passwords are properly hashed using bcrypt
* JWT tokens expire after 1 hour, refresh tokens after 7 days

Technical Notes:
* Use bcrypt with salt rounds of 12 for password hashing
* Implement JWT with RS256 algorithm for better security
* Add request rate limiting (5 attempts per minute for login)
* Include CORS headers for frontend integration
* Log all authentication attempts for security monitoring

Data Requirements:
* User email (required, valid email format)
* User password (required, minimum 8 characters)
* Device information for session tracking
* IP address for security logging`,
        issueType: 'Task',
        priority: 'High',
        status: 'To Do',
        assignee: 'Mike Johnson',
        labels: ['api', 'authentication', 'security'],
        components: ['Backend API'],
        customFields: {}
    },
    {
        key: 'MTO-1845',
        summary: '[MTO] Simple task without detailed description',
        description: `Update database schema for new feature.`,
        issueType: 'Task',
        priority: 'Low',
        status: 'To Do',
        assignee: 'Sarah Wilson',
        labels: ['database', 'schema'],
        components: ['Database'],
        customFields: {}
    },
    {
        key: 'MTO-1941',
        summary: '[MTO] Remove leading 0 from order numbers',
        description: `We should remove the leading 0 from all order numbers

So instead of "0700000039" it should be 

"700000039"

Used in the following places:

Backoffice portal

Order Details Page header

Order Details Page below header

Order Overview Page (Order ID table column)

CH 

Order title section

V2

Thank you page`,
        issueType: 'Task',
        priority: 'Medium',
        status: 'To Do',
        assignee: 'John Smith',
        labels: ['frontend', 'formatting'],
        components: ['Frontend', 'Backoffice'],
        customFields: {}
    }
];

// Enhanced Content-Aware parser for real ticket analysis
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

            // Extract role from "as" statements
            if (line.match(/^\*?as\*?\s/i)) {
                userRole = line.replace(/^\*?as\*?\s/i, '').replace(/\*/g, '').trim();
            }

            // Extract goal from "i want to" statements
            if (line.match(/^\*?i want to\*?\s/i)) {
                goal = line.replace(/^\*?i want to\*?\s/i, '').replace(/\*/g, '').trim();
            }

            // Extract benefit from "so that" statements
            if (line.match(/^\*?so that\*?\s/i)) {
                benefit = line.replace(/^\*?so that\*?\s/i, '').replace(/\*/g, '').trim();
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
            if (line.toLowerCase().includes('acceptance criteria') ||
                line.toLowerCase().includes('requirements') ||
                line.toLowerCase().includes('data to be provided') ||
                line.toLowerCase().includes('endpoint details') ||
                line.toLowerCase().includes('*tech notes*') ||
                line.toLowerCase().includes('technical notes') ||
                line.toLowerCase().includes('security requirements') ||
                line.toLowerCase().match(/^data to be provided to/)) {
                inCriteriaSection = true;
                continue;
            }

            // Detect end of criteria section - more patterns
            if (inCriteriaSection && (
                line.startsWith('*Tech') ||
                line.startsWith('[^') ||
                line.toLowerCase().includes('note') ||
                line.toLowerCase().includes('*scenarios:*') ||
                line.toLowerCase().includes('*given:*') ||
                line.toLowerCase().includes('*when:*') ||
                line.toLowerCase().includes('*then:*') ||
                line.toLowerCase().includes('rejection flow will be') ||
                line.startsWith('*Environment:*') ||
                line.startsWith('*URL:*') ||
                line.startsWith('*Steps to reproduce:*')
            )) {
                inCriteriaSection = false;
                if (currentList.length > 0) {
                    criteria.push(...currentList);
                    currentList = [];
                }
                continue;
            }

            // Extract bullet points in criteria sections - more patterns
            if (inCriteriaSection && (
                line.startsWith('* ') ||
                line.startsWith('- ') ||
                line.match(/^\d+\./) ||
                line.startsWith('• ') ||
                line.match(/^[a-zA-Z\s]+ endpoint/) ||
                line.match(/^[A-Z][a-z]+ [a-z]+ .+ endpoint/) // "POST /auth/login endpoint..."
            )) {
                let cleanLine = line.replace(/^[*\-\d\.\•]\s*/, '').trim();

                // Special handling for endpoint descriptions
                if (cleanLine.includes(' endpoint ') && !cleanLine.endsWith('endpoint')) {
                    cleanLine = cleanLine.replace(/ endpoint /, ' endpoint: ');
                }

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
        const dataFields = [];
        const lines = description.split('\n').map(line => line.trim());

        let inDataSection = false;

        for (const line of lines) {
            if (line.toLowerCase().includes('data to be provided') ||
                line.toLowerCase().includes('data fields') ||
                line.toLowerCase().includes('information needed')) {
                inDataSection = true;
                continue;
            }

            if (inDataSection && line.startsWith('* ')) {
                dataFields.push(line.replace(/^\*\s*/, '').trim());
            }

            // Stop at next major section
            if (inDataSection && (line.startsWith('-Endpoint') || line.startsWith('*Tech') || line.startsWith('[^'))) {
                break;
            }
        }

        return dataFields;
    }

    extractBusinessRules(description) {
        const rules = [];
        const lines = description.split('\n').map(line => line.trim());

        // Look for conditional statements and business logic
        for (const line of lines) {
            if (line.toLowerCase().includes('should be') ||
                line.toLowerCase().includes('must be') ||
                line.toLowerCase().includes('if ') ||
                line.toLowerCase().includes('when ') ||
                line.toLowerCase().includes('unless ')) {
                rules.push(line);
            }
        }

        return rules;
    }

    generateScenariosFromContent(description, summary, issueType) {
        const userStory = this.extractUserStory(description);
        const acceptanceCriteria = this.extractAcceptanceCriteria(description);
        const technicalNotes = this.extractTechnicalNotes(description);
        const dataRequirements = this.extractDataRequirements(description);

        const scenarios = [];

        // Only generate scenarios if we have clear Gherkin-style content
        const hasGherkinFormat = userStory.userRole && userStory.goal && userStory.benefit;

        console.log('Gherkin check:', {
            hasUserRole: !!userStory.userRole,
            hasGoal: !!userStory.goal,
            hasBenefit: !!userStory.benefit,
            hasGherkinFormat
        });

        if (!hasGherkinFormat) {
            console.log('Not Gherkin format, returning empty scenarios for non-Gherkin parsing');
            return []; // Return empty to trigger non-Gherkin parsing
        }

        // Main happy path scenario based on user story
        if (userStory.goal) {
            scenarios.push({
                title: `User can ${userStory.goal}`,
                userRole: userStory.userRole || 'user',
                type: 'functional',
                preconditions: this.generatePreconditions(userStory, issueType),
                steps: this.generateStepsFromGoal(userStory.goal, acceptanceCriteria),
                acceptanceCriteria: acceptanceCriteria
            });
        }

        // Data validation scenarios
        if (dataRequirements.length > 0) {
            scenarios.push({
                title: 'Data requirements are met',
                userRole: userStory.userRole || 'user',
                type: 'data-validation',
                preconditions: [`User is logged in as ${userStory.userRole || 'user'}`, 'System has required data access'],
                steps: this.generateDataValidationSteps(dataRequirements),
                acceptanceCriteria: dataRequirements
            });
        }

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

        // Error handling scenarios
        if (issueType === 'Bug' || acceptanceCriteria.some(c => c.toLowerCase().includes('error'))) {
            scenarios.push({
                title: 'Error handling works correctly',
                userRole: userStory.userRole || 'user',
                type: 'negative',
                preconditions: [`User is logged in as ${userStory.userRole || 'user'}`],
                steps: this.generateErrorHandlingSteps(userStory.goal, acceptanceCriteria),
                acceptanceCriteria: acceptanceCriteria.filter(c => c.toLowerCase().includes('error'))
            });
        }

        return scenarios;
    }

    // New method: Parse non-Gherkin tickets and extract what needs to be changed/tested
    generateScenariosFromRequirements(description, summary, issueType) {
        const scenarios = [];
        const lines = description.split('\n').map(line => line.trim());

        // Extract what needs to be changed/implemented
        const changes = this.extractChanges(description, summary);
        const locations = this.extractTestLocations(description);
        const requirements = this.extractRequirements(description);

        console.log('Non-Gherkin parsing:', { changes, locations: locations.length, requirements: requirements.length });

        // Generate scenarios based on extracted information
        if (changes.action && locations.length > 0) {
            // Create verification scenarios for each location
            scenarios.push({
                title: `Verify ${changes.action} in all specified locations`,
                userRole: 'user',
                type: 'functional',
                preconditions: this.generatePreconditionsFromChanges(changes, issueType),
                steps: this.generateStepsFromChanges(changes, locations),
                acceptanceCriteria: locations.map(loc => `${changes.action} is correctly implemented in ${loc}`)
            });
        } else if (requirements.length > 0) {
            // Create scenarios based on requirements
            scenarios.push({
                title: `Verify implementation of requirements`,
                userRole: 'user',
                type: 'functional',
                preconditions: [`User has access to the system`, 'All required components are available'],
                steps: this.generateStepsFromRequirements(requirements),
                acceptanceCriteria: requirements
            });
        }

        // Add edge cases and negative testing if applicable
        if (changes.action && changes.action.includes('remove')) {
            scenarios.push({
                title: `Verify edge cases for ${changes.action}`,
                userRole: 'user',
                type: 'edge-case',
                preconditions: this.generatePreconditionsFromChanges(changes, issueType),
                steps: this.generateEdgeCaseSteps(changes, locations),
                acceptanceCriteria: [`${changes.action} works correctly in all edge cases`]
            });
        }

        return scenarios;
    }

    extractChanges(description, summary) {
        const text = (description + ' ' + summary).toLowerCase();

        // Patterns for different types of changes
        const changePatterns = {
            remove: /(?:remove|delete|eliminate)\s+(?:the\s+)?(.+?)(?:\s+from|\s+in|\s+on|$)/g,
            add: /(?:add|include|insert)\s+(.+?)(?:\s+to|\s+in|\s+on|$)/g,
            change: /(?:change|modify|update|replace)\s+(.+?)(?:\s+to|\s+with|\s+in|$)/g,
            fix: /(?:fix|correct|repair)\s+(.+?)(?:\s+in|\s+on|$)/g,
            show: /(?:show|display|present)\s+(.+?)(?:\s+in|\s+on|$)/g,
            hide: /(?:hide|conceal)\s+(.+?)(?:\s+from|\s+in|$)/g
        };

        for (const [action, pattern] of Object.entries(changePatterns)) {
            const matches = [...text.matchAll(pattern)];
            if (matches.length > 0) {
                const target = matches[0][1]?.trim();
                if (target) {
                    return {
                        action: `${action} ${target}`,
                        actionType: action,
                        target: target
                    };
                }
            }
        }

        return { action: null, actionType: null, target: null };
    }

    extractTestLocations(description) {
        const locations = [];
        const lines = description.split('\n').map(line => line.trim());

        let inLocationsSection = false;

        for (const line of lines) {
            // Detect locations sections
            if (line.toLowerCase().includes('used in') ||
                line.toLowerCase().includes('following places') ||
                line.toLowerCase().includes('locations') ||
                line.toLowerCase().includes('areas') ||
                line.toLowerCase().includes('pages')) {
                inLocationsSection = true;
                continue;
            }

            // Stop if we hit another section or empty line after locations
            if (inLocationsSection && (line === '' || line.startsWith('image-') || line.startsWith('*'))) {
                if (line === '' && locations.length > 0) {
                    break;
                }
                continue;
            }

            // Extract location names
            if (inLocationsSection) {
                // Clean up location names
                let location = line.replace(/^[*\-•]\s*/, '').trim();
                if (location && !location.startsWith('image-')) {
                    locations.push(location);
                }
            }
        }

        return locations;
    }

    extractRequirements(description) {
        const requirements = [];
        const lines = description.split('\n').map(line => line.trim());

        for (const line of lines) {
            // Look for requirement-like statements
            if (line.includes('should ') ||
                line.includes('must ') ||
                line.includes('need to ') ||
                line.includes('required ') ||
                line.includes('instead of')) {
                requirements.push(line);
            }
        }

        return requirements;
    }

    generatePreconditionsFromChanges(changes, issueType) {
        const preconditions = ['User has access to the system'];

        if (changes.target && changes.target.includes('order')) {
            preconditions.push('Test orders are available in the system');
            preconditions.push('User has permissions to view order information');
        }

        if (issueType === 'Bug') {
            preconditions.push('System is in the state where the issue can be reproduced');
        }

        return preconditions;
    }

    generateStepsFromChanges(changes, locations) {
        const steps = [];
        let stepNumber = 1;

        // Initial setup step
        steps.push({
            step: stepNumber++,
            action: 'Navigate to the system and prepare test data if needed',
            expectedResult: 'System is accessible and test data is ready'
        });

        // Test each location
        locations.forEach(location => {
            steps.push({
                step: stepNumber++,
                action: `Navigate to ${location} and verify that ${changes.action}`,
                expectedResult: `In ${location}, ${changes.action} is correctly implemented`
            });
        });

        // Final verification step
        steps.push({
            step: stepNumber++,
            action: 'Verify consistency across all tested locations',
            expectedResult: `${changes.action} is consistently applied in all specified locations`
        });

        return steps;
    }

    generateStepsFromRequirements(requirements) {
        return requirements.map((req, index) => ({
            step: index + 1,
            action: `Verify that ${req.toLowerCase()}`,
            expectedResult: `Requirement "${req}" is correctly implemented`
        }));
    }

    generateEdgeCaseSteps(changes, locations) {
        const steps = [];
        let stepNumber = 1;

        if (changes.actionType === 'remove' && changes.target.includes('0')) {
            steps.push({
                step: stepNumber++,
                action: 'Test with order numbers that start with multiple zeros (e.g., "00700000039")',
                expectedResult: 'All leading zeros are removed correctly, showing "700000039"'
            });

            steps.push({
                step: stepNumber++,
                action: 'Test with order numbers that have zeros in the middle (e.g., "7000000039")',
                expectedResult: 'Only leading zeros are removed, middle zeros remain: "7000000039"'
            });

            steps.push({
                step: stepNumber++,
                action: 'Test with order numbers that are all zeros (e.g., "0000000000")',
                expectedResult: 'System handles edge case appropriately (shows "0" or handles gracefully)'
            });
        }

        return steps;
    }

    generatePreconditions(userStory, issueType) {
        const preconditions = [];

        if (userStory.userRole) {
            preconditions.push(`User is logged in as ${userStory.userRole}`);
            preconditions.push(`User has necessary permissions for ${userStory.userRole} role`);
        }

        if (issueType === 'Story') {
            preconditions.push('All required systems are available and functioning');
        } else if (issueType === 'Bug') {
            preconditions.push('System is in the state where the bug can be reproduced');
        }

        return preconditions;
    }

    generateStepsFromGoal(goal, acceptanceCriteria) {
        const steps = [];
        let stepNumber = 1;

        // More intelligent step generation based on goal analysis
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

        if (goal.includes('push') || goal.includes('send') || goal.includes('sync') || goal.includes('integrate')) {
            steps.push({
                step: stepNumber++,
                action: 'Initiate the data synchronization or push process',
                expectedResult: 'System starts the data transfer process without errors'
            });

            steps.push({
                step: stepNumber++,
                action: 'Verify that data is correctly transmitted to the target system',
                expectedResult: 'Data appears correctly in the destination system with all required fields'
            });
        }

        if (goal.includes('create') || goal.includes('implement') || goal.includes('add')) {
            steps.push({
                step: stepNumber++,
                action: 'Access the creation or implementation interface',
                expectedResult: 'User can access the required interface successfully'
            });

            steps.push({
                step: stepNumber++,
                action: 'Provide all required information and trigger the creation process',
                expectedResult: 'System accepts the input and processes the creation request'
            });
        }

        if (goal.includes('improvement') || goal.includes('clearer') || goal.includes('better')) {
            steps.push({
                step: stepNumber++,
                action: 'Navigate to the area that has been improved',
                expectedResult: 'User can access the improved interface or feature'
            });

            steps.push({
                step: stepNumber++,
                action: 'Interact with the improved feature and observe the changes',
                expectedResult: 'Improvements are visible and functioning as expected'
            });
        }

        // Add steps based on acceptance criteria - more sophisticated mapping
        acceptanceCriteria.forEach((criteria, index) => {
            if (criteria.includes('endpoint') && criteria.includes('accepts')) {
                steps.push({
                    step: stepNumber++,
                    action: `Test the ${criteria.split(' ')[0]} endpoint with valid parameters`,
                    expectedResult: `Endpoint responds correctly and ${criteria.toLowerCase()}`
                });
            } else if (criteria.includes('returns') || criteria.includes('provides')) {
                steps.push({
                    step: stepNumber++,
                    action: `Verify that the system ${criteria.toLowerCase()}`,
                    expectedResult: `${criteria} is correctly implemented and visible`
                });
            } else if (criteria.includes('error') || criteria.includes('validation')) {
                steps.push({
                    step: stepNumber++,
                    action: `Test error handling and validation by ${criteria.toLowerCase()}`,
                    expectedResult: `${criteria} works correctly with appropriate feedback`
                });
            } else {
                steps.push({
                    step: stepNumber++,
                    action: `Verify that ${criteria.toLowerCase()}`,
                    expectedResult: `${criteria} is correctly implemented and visible`
                });
            }
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

    generateDataValidationSteps(dataRequirements) {
        return dataRequirements.map((requirement, index) => ({
            step: index + 1,
            action: `Verify that ${requirement.toLowerCase()} is captured and displayed correctly`,
            expectedResult: `${requirement} appears with correct format and data`
        }));
    }

    generateTechnicalSteps(technicalNotes) {
        return technicalNotes.map((note, index) => ({
            step: index + 1,
            action: `Verify that ${note.toLowerCase().replace(/^(for now|take a note)/, 'system')}`,
            expectedResult: `Technical requirement "${note}" is properly implemented`
        }));
    }

    generateErrorHandlingSteps(goal, acceptanceCriteria) {
        const steps = [];
        let stepNumber = 1;

        steps.push({
            step: stepNumber++,
            action: 'Attempt the main action with invalid or missing data',
            expectedResult: 'System handles the error gracefully'
        });

        steps.push({
            step: stepNumber++,
            action: 'Verify appropriate error messages are displayed',
            expectedResult: 'User receives clear and helpful error information'
        });

        steps.push({
            step: stepNumber++,
            action: 'Confirm system remains stable after error',
            expectedResult: 'System continues to function normally'
        });

        return steps;
    }
}

const contentParser = new ContentAwareParser();

// Enhanced test case generator with real content analysis
function generateTestCases(ticket) {
    console.log(`\n=== Generating test cases for ${ticket.key} ===`);
    console.log('Ticket description:', ticket.description ? ticket.description.substring(0, 200) + '...' : 'NO DESCRIPTION');
    console.log('Ticket summary:', ticket.summary);
    console.log('Issue type:', ticket.issueType);

    const analysis = contentParser.parseTicketContent(ticket.description, ticket.summary, ticket.issueType);

    console.log('Analysis result:', {
        hasUserStory: !!analysis?.userStory?.userRole,
        scenariosCount: analysis?.scenarios?.length || 0,
        hasCriteria: analysis?.acceptanceCriteria?.length || 0,
        hasTechnicalNotes: analysis?.technicalNotes?.length || 0
    });

    if (!analysis || analysis.scenarios.length === 0) {
        console.log('Using fallback test case generation (no scenarios found)');
        return generateFallbackTestCase(ticket);
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

// Fallback for tickets without clear structure
function generateFallbackTestCase(ticket) {
    const userRole = extractRoleFromSummary(ticket.summary) || 'user';

    return [{
        id: `${ticket.key}-TC-001`,
        title: `Verify ${ticket.summary}`,
        description: `Test case generated from ${ticket.issueType} ${ticket.key}`,
        userRole: userRole,
        testType: ticket.issueType === 'Bug' ? 'regression' : 'functional',
        userStory: { userRole, goal: 'complete the requirement', benefit: 'system works as expected' },
        preconditions: [`User is logged in as ${userRole}`, 'System is available and functioning'],
        steps: [
            {
                step: 1,
                action: 'Navigate to the relevant feature area based on ticket description',
                expectedResult: 'User can access the area successfully'
            },
            {
                step: 2,
                action: 'Perform the actions described in the ticket',
                expectedResult: 'Actions complete without errors'
            },
            {
                step: 3,
                action: 'Verify the expected outcome matches ticket requirements',
                expectedResult: 'System behaves as described in the ticket'
            }
        ],
        acceptanceCriteria: ['Functionality works as described in ticket'],
        expectedResult: 'All requirements from the ticket are fulfilled',
        priority: ticket.priority,
        labels: [...ticket.labels, 'functional-test', ticket.issueType.toLowerCase(), `role-${userRole}`],
        linkedTicket: ticket.key,
        status: 'pending',
        assignee: ticket.assignee,
        components: ticket.components,
        technicalNotes: [],
        dataRequirements: [],
        businessRules: []
    }];
}// Helper function to extract role from ticket summary
function extractRoleFromSummary(summary) {
    // Common role patterns in tickets
    const rolePatterns = [
        /\b(admin|administrator)\b/i,
        /\b(user|end user|customer)\b/i,
        /\b(manager|supervisor)\b/i,
        /\b(developer|dev)\b/i,
        /\b(tester|qa)\b/i,
        /\b(analyst|business analyst)\b/i,
        /\b(support|customer support)\b/i,
        /\b(designer)\b/i
    ];

    for (const pattern of rolePatterns) {
        const match = summary.match(pattern);
        if (match) {
            return match[1].toLowerCase();
        }
    }

    return null;
}

// Routes

// Test Jira connection
app.get('/api/jira/test-connection', async (req, res) => {
    if (!jiraClient) {
        return res.status(400).json({
            success: false,
            error: 'Jira not configured. Please set JIRA_URL, JIRA_EMAIL, and JIRA_TOKEN.'
        });
    }

    try {
        const result = await jiraClient.testConnection();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to test Jira connection'
        });
    }
});

// Test specific board access
app.get('/api/jira/boards/:boardId/test', async (req, res) => {
    if (!jiraClient) {
        return res.status(400).json({
            success: false,
            error: 'Jira not configured'
        });
    }

    try {
        const { boardId } = req.params;
        const result = await jiraClient.testBoardAccess(boardId);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to test board access'
        });
    }
});

// Get Jira boards
app.get('/api/jira/boards', async (req, res) => {
    if (!jiraClient) {
        return res.json({
            success: false,
            error: 'Jira not configured',
            boards: []
        });
    }

    try {
        const result = await jiraClient.getBoards();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch boards'
        });
    }
});

// Get sprints for a board
app.get('/api/jira/boards/:boardId/sprints', async (req, res) => {
    if (!jiraClient) {
        return res.json({
            success: false,
            error: 'Jira not configured',
            sprints: []
        });
    }

    try {
        const { boardId } = req.params;
        const { includeAll } = req.query;

        const result = includeAll === 'true'
            ? await jiraClient.getAllSprints(boardId)
            : await jiraClient.getActiveSprints(boardId);

        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sprints'
        });
    }
});

// Get all tickets from a board
app.get('/api/jira/boards/:boardId/tickets', async (req, res) => {
    try {
        const { boardId } = req.params;
        const { activeOnly } = req.query; // New parameter to filter active tickets only

        if (!jiraClient) {
            // Return mock data for development
            return res.json({
                success: true,
                tickets: mockTickets.slice(0, 10), // Return more mock data for board view
                total: mockTickets.length,
                source: 'mock'
            });
        }

        const result = await jiraClient.getBoardTickets(boardId);
        res.json({
            ...result,
            source: 'jira'
        });
    } catch (error) {
        console.error('Error in board tickets endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch board tickets',
            details: error.message
        });
    }
});

// Get tickets from a sprint
app.get('/api/jira/boards/:boardId/sprints/:sprintId/tickets', async (req, res) => {
    try {
        const { boardId, sprintId } = req.params;

        if (!jiraClient) {
            // Return mock data for development
            return res.json({
                success: true,
                tickets: mockTickets.slice(0, 5), // Return subset of mock data
                total: mockTickets.length,
                source: 'mock'
            });
        }

        const result = await jiraClient.getSprintTickets(sprintId, boardId);
        res.json({
            ...result,
            source: 'jira'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch sprint tickets'
        });
    }
});

// Get tickets using JQL
app.post('/api/jira/search', async (req, res) => {
    if (!jiraClient) {
        return res.json({
            success: false,
            error: 'Jira not configured',
            tickets: []
        });
    }

    try {
        const { jql, maxResults = 50 } = req.body;

        if (!jql) {
            return res.status(400).json({
                success: false,
                error: 'JQL query is required'
            });
        }

        const result = await jiraClient.getTicketsByJQL(jql, maxResults);
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to search tickets'
        });
    }
});

// Original tickets endpoint (backwards compatibility)
app.get('/api/tickets', async (req, res) => {
    try {
        // If Jira is configured, try to get recent tickets
        if (jiraClient) {
            const jql = 'ORDER BY updated DESC';
            const result = await jiraClient.getTicketsByJQL(jql, 20);

            if (result.success) {
                return res.json({
                    success: true,
                    tickets: result.tickets,
                    total: result.total,
                    source: 'jira'
                });
            }
        }

        // Fallback to mock data
        res.json({
            success: true,
            tickets: mockTickets,
            total: mockTickets.length,
            source: 'mock'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch tickets'
        });
    }
});

app.post('/api/generate-test-cases', (req, res) => {
    try {
        const { ticket } = req.body;

        if (!ticket) {
            return res.status(400).json({
                success: false,
                error: 'Ticket data is required'
            });
        }

        console.log(`\n🎯 GENERATING TEST CASES FOR: ${ticket.key}`);
        console.log(`📝 Summary: ${ticket.summary}`);
        console.log(`🔧 Type: ${ticket.issueType}`);

        const testCases = generateTestCases(ticket);

        console.log(`✅ Generated ${testCases.length} test case(s) for ${ticket.key}\n`);

        res.json(testCases);
    } catch (error) {
        console.error('❌ Error generating test cases:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate test cases'
        });
    }
});

// Test endpoint to debug a specific ticket
app.post('/api/debug-ticket', (req, res) => {
    try {
        const { ticket } = req.body;

        if (!ticket) {
            return res.status(400).json({
                success: false,
                error: 'Ticket data is required'
            });
        }

        console.log('\n=== DEBUG TICKET ===');
        console.log('Key:', ticket.key);
        console.log('Summary:', ticket.summary);
        console.log('Description length:', ticket.description ? ticket.description.length : 0);
        console.log('Description preview:', ticket.description ? ticket.description.substring(0, 300) : 'NO DESCRIPTION');
        console.log('Issue type:', ticket.issueType);

        const analysis = contentParser.parseTicketContent(ticket.description, ticket.summary, ticket.issueType);

        console.log('\nParsed analysis:');
        console.log('- User story:', analysis?.userStory);
        console.log('- Acceptance criteria count:', analysis?.acceptanceCriteria?.length || 0);
        console.log('- Scenarios count:', analysis?.scenarios?.length || 0);
        console.log('- Technical notes count:', analysis?.technicalNotes?.length || 0);

        if (analysis?.scenarios) {
            console.log('\nScenarios:');
            analysis.scenarios.forEach((scenario, i) => {
                console.log(`  ${i + 1}. ${scenario.title} (${scenario.type})`);
            });
        }

        res.json({
            success: true,
            ticket: {
                key: ticket.key,
                summary: ticket.summary,
                descriptionLength: ticket.description ? ticket.description.length : 0,
                issueType: ticket.issueType
            },
            analysis: analysis
        });

    } catch (error) {
        console.error('Error debugging ticket:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to debug ticket'
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'Jira Test Case Generator API'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        error: 'Something went wrong!'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found'
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
});