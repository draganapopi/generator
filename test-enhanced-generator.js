const { generateTestCases, mockTickets } = require('./src/lib/test-case-generator');

console.log('Testing Enhanced Test Case Generator');
console.log('====================================');

// Test each mock ticket
mockTickets.forEach((ticket, index) => {
    console.log(`\n--- Testing Ticket ${index + 1}: ${ticket.key} ---`);
    console.log(`Summary: ${ticket.summary}`);
    console.log(`Type: ${ticket.issueType}`);

    try {
        const testCases = generateTestCases(ticket);
        console.log(`Generated ${testCases.length} test cases:`);

        testCases.forEach((testCase, tcIndex) => {
            console.log(`\n  Test Case ${tcIndex + 1}:`);
            console.log(`    ID: ${testCase.id}`);
            console.log(`    Title: ${testCase.title}`);
            console.log(`    User Role: ${testCase.userRole}`);
            console.log(`    Test Type: ${testCase.testType}`);
            console.log(`    Components: ${testCase.components.join(', ')}`);
            console.log(`    Labels: ${testCase.labels.slice(0, 10).join(', ')}${testCase.labels.length > 10 ? '...' : ''}`);
            console.log(`    Steps: ${testCase.steps.length} steps`);

            // Show first few steps
            testCase.steps.slice(0, 3).forEach((step, stepIndex) => {
                console.log(`      Step ${step.step}: ${step.action}`);
            });

            if (testCase.steps.length > 3) {
                console.log(`      ... and ${testCase.steps.length - 3} more steps`);
            }
        });

    } catch (error) {
        console.error(`Error generating test cases for ${ticket.key}:`, error.message);
    }
});

console.log('\n====================================');
console.log('Enhanced Test Case Generator Test Complete');