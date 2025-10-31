// Test specific features of the enhanced test case generator
console.log('Testing Enhanced Test Case Generator Features');
console.log('===========================================');

// Mock ticket that should trigger order number formatting pattern
const orderNumberTicket = {
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
};

// Manual test of individual components to verify they work
try {
    // Test component detection
    console.log('\n--- Testing Component Detection ---');

    // Import ContentAwareParser if available
    const { ContentAwareParser } = require('./src/lib/test-case-generator');
    const parser = new ContentAwareParser();

    const components = parser.detectComponents(
        orderNumberTicket.description,
        orderNumberTicket.summary,
        orderNumberTicket.issueType
    );

    console.log('Detected components:', components);

    // Test pattern detection
    console.log('\n--- Testing Pattern Detection ---');
    const patterns = parser.detectContentPatterns(
        orderNumberTicket.description,
        orderNumberTicket.summary,
        orderNumberTicket.issueType
    );

    console.log('Detected patterns:', patterns);

    // Test role mapping
    console.log('\n--- Testing Role Mapping ---');
    const testRoles = ['prepress senior', 'customer', 'support agent', 'user'];
    testRoles.forEach(role => {
        const mappedRole = parser.mapToApplicationRole(role);
        console.log(`"${role}" -> "${mappedRole}"`);
    });

    // Test enhanced label generation with mock scenario
    console.log('\n--- Testing Enhanced Label Generation ---');
    const mockScenario = {
        title: 'Test scenario',
        userRole: 'customer',
        type: 'functional',
        preconditions: [],
        steps: [],
        acceptanceCriteria: []
    };

    const labels = parser.generateEnhancedLabels(
        orderNumberTicket,
        mockScenario,
        components,
        patterns
    );

    console.log('Generated labels:', labels);

    console.log('\n✓ All component tests passed!');

} catch (error) {
    console.error('❌ Error in component testing:', error.message);
}

console.log('\n=== Testing Complete ===');