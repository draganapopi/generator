// Test script to verify all three ticket types generate proper test cases
const { exec } = require('child_process');
const fs = require('fs');

// Test tickets for each type
const testTickets = [
    // Type 1: As a "role" without gherkin
    {
        key: "MTO-1834",
        summary: "[MTO][Backoffice] MVP - Possibility to push open orders to Salesforce",
        description: "*as* customer care\n\n*i want to* be able to see on Salesforce a list of open MTO orders\n\n*so that* I can have an easy overview if orders need to be processed\n\nData to be provided to Salesforce:\n\n* order number\n* customer SAP number\n* Contact e-mail\n* Item code \n* status \n* date entered \n* NEW: Last order update (so we are able to trigger notifications to customers if they have a pending order to act on)\n\n-Endpoint details pending- Endpoint specification attached.\n\n[^Upsert Order API.pdf]\n\n*Tech notes:*\n\n* scheduled function pushing data to SF every 5 minutes (configure this)\n* for DPAP and CANC order status order should be pushed just first time (track order on db), all other should be pushed always. SF system will do upsert.    \n* For now send orders in batch (500 for start, configure this)\n* take a note performance (what happened if one endpoint didn't end second is started in a range of 5 minutes) ",
        issueType: "Story",
        priority: "Medium",
        status: "In Progress",
        assignee: "Zarko Bakurski",
        labels: [],
        components: []
    },
    // Type 2: As a "role" with gherkin
    {
        key: "MTO-1334",
        summary: "[MTO] [PrdConf] Load description from back-office portal",
        description: "*as a* Product Configurator user\n*i want to* load product description template\n*so that* data from back office portal will be used\n*and* everything about product will be on one place\n\n\n*Scenario 1: Show styled product description & documents data in the configurator*\n*GIVEN:* The user select some product on Intershop webpage\n*WHEN:* The product configurator is loaded\n*THEN:* Product description & documents will be shown with data set in Backoffice portal\n*AND:* this data will have to be positioned according to {{position}}set and styled according to properties set up (for example: if text has {{isBold}} then text will be bold on UI, or {{isUnderlined}} will show line under text, etc.) \n*IF:* There is no data about product\n*THEN:* data from intershop will be loaded ( old approach )\n\n*Important: First display Product Long Descriptions and below them display Product Documents.* \n\n\n*Scenario 2: Create Documents & LongDescriptions endpoints based on ones create for Backoffice*\n*GIVEN:* That user opens some product on Intershop webpage\n*WHEN:* Configurator sends the request to the API\n*THEN:* the API will return {{long-descriptions}} & {{documents}} data in the response\n*AND:* {{DocumentPath}} should contain working SAS token\n*AND:* configurator will show it on a page",
        issueType: "Story",
        priority: "Medium", 
        status: "QA TESTING DONE",
        assignee: "Dragana Popi",
        labels: [],
        components: []
    },
    // Type 3: Just description without "as" or gherkin
    {
        key: "MTO-1941",
        summary: "[MTO] Remove leading 0 from order numbers",
        description: "We should remove the leading 0 from all order numbers\n\nSo instead of \"0700000039\" it should be \n\n\"700000039\"\n\n*Used in the following places:*\n\n# Backoffice portal\n## Order Details Page header\n## Order Details Page below header\n## Order Overview Page (Order ID table column)\n# CH \n## Order title section\n# V2\n## Thank you page",
        issueType: "Story",
        priority: "Medium",
        status: "QA TESTING DONE",
        assignee: "Dragana Popi",
        labels: [],
        components: []
    }
];

console.log('🧪 Testing ticket type processing...\n');

// Test each ticket type
testTickets.forEach((ticket, index) => {
    console.log(`=== Testing Type ${index + 1}: ${ticket.key} ===`);
    console.log(`Summary: ${ticket.summary}`);
    console.log(`Description length: ${ticket.description.length} characters`);
    
    // Import the server logic to test directly
    try {
        // We can't import directly due to the server setup, 
        // so we'll make HTTP requests to test the implementation
        makeTestRequest(ticket, index + 1);
    } catch (error) {
        console.error(`Error testing ${ticket.key}:`, error.message);
    }
    
    console.log(''); // Add spacing
});

function makeTestRequest(ticket, typeNumber) {
    const http = require('http');
    
    const postData = JSON.stringify({ ticket });
    
    const options = {
        hostname: 'localhost',
        port: 3001,
        path: '/api/show-test-cases',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };
    
    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const testCases = JSON.parse(data);
                console.log(`✅ Generated ${testCases.length} test case(s)`);
                
                testCases.forEach((testCase, index) => {
                    console.log(`   ${index + 1}. ${testCase.title}`);
                    console.log(`      Type: ${testCase.testType}`);
                    console.log(`      Role: ${testCase.userRole}`);
                    console.log(`      Steps: ${testCase.steps.length}`);
                    console.log(`      Preconditions: ${testCase.preconditions.length}`);
                });
            } catch (error) {
                console.error(`❌ Error parsing response for ${ticket.key}:`, error.message);
                console.log('Raw response:', data);
            }
        });
    });
    
    req.on('error', (error) => {
        console.error(`❌ Request failed for ${ticket.key}:`, error.message);
    });
    
    req.write(postData);
    req.end();
}

console.log('Note: Make sure the server is running on localhost:3001 before running this test');