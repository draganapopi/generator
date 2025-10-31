// Test the current implementation with the MTO-1884 ticket
const testTicket = {
    "key": "MTO-1884",
    "summary": "[MTO][CH] Non-MVP - Cancelled orders should include a card on communication history",
    "description": "*as* prepress\n\n*i want to* see a card mentioning that an order is cancelled\n\n*so that* it's clear and part of the entire history\n\n!image-20250924-104242.png|width=342,alt=\"image-20250924-104242.png\"!\n\nTechnical notes:\n\n* Should be as text history item card",
    "issueType": "Story",
    "priority": "Medium",
    "status": "In Review",
    "assignee": "Uros Jovic",
    "labels": [],
    "components": [],
    "sprint": {
        "id": 2496,
        "name": "MTO Sprint 37 (Q4/2025)",
        "state": "active"
    },
    "storyPoints": null,
    "customFields": {}
};

// Test API endpoint
fetch('http://localhost:3001/api/show-test-cases', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ticket: testTicket })
})
    .then(response => response.json())
    .then(data => {
        console.log('Generated test cases:');
        console.log(JSON.stringify(data, null, 2));
    })
    .catch(error => {
        console.error('Error:', error);
    });