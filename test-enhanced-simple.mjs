// Simple test to verify enhanced test case generation
import { generateTestCases } from './src/lib/test-case-generator.js';

// Test the prepress filter ticket (should demonstrate role-based testing)
const prepressFilterTicket = {
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
};

console.log('Testing Enhanced Features:');
console.log('========================');

try {
    const testCases = generateTestCases(prepressFilterTicket);

    console.log(`\nGenerated ${testCases.length} test cases for ${prepressFilterTicket.key}`);

    testCases.forEach((testCase, index) => {
        console.log(`\nTest Case ${index + 1}:`);
        console.log(`- ID: ${testCase.id}`);
        console.log(`- Title: ${testCase.title}`);
        console.log(`- User Role: ${testCase.userRole}`);
        console.log(`- Components: ${testCase.components?.join(', ') || 'None'}`);
        console.log(`- Labels: ${testCase.labels?.slice(0, 8).join(', ') || 'None'}`);
        console.log(`- Test Type: ${testCase.testType}`);
        console.log(`- Steps: ${testCase.steps?.length || 0} steps`);

        // Show key evidence of enhanced features
        const hasRoleAwareSteps = testCase.steps?.some(step =>
            step.action.includes('prepress') ||
            step.action.includes('Backoffice') ||
            step.action.includes('Log in as')
        );

        const hasEnhancedLabels = testCase.labels?.some(label =>
            label.includes('backoffice') ||
            label.includes('filter') ||
            label.includes('prepress')
        );

        console.log(`- Role-aware steps: ${hasRoleAwareSteps ? 'YES' : 'NO'}`);
        console.log(`- Enhanced labels: ${hasEnhancedLabels ? 'YES' : 'NO'}`);

        // Show first 2 steps to verify role-aware generation
        if (testCase.steps && testCase.steps.length > 0) {
            console.log('- First steps:');
            testCase.steps.slice(0, 2).forEach(step => {
                console.log(`  ${step.step}. ${step.action}`);
            });
        }
    });

    console.log('\n✓ Enhanced test case generation completed successfully!');

} catch (error) {
    console.error('❌ Error testing enhanced features:', error.message);
    console.error(error.stack);
}