import { JiraTicket } from './jira-client';

// Centralized mock tickets for development fallback
export const mockTickets: JiraTicket[] = [
    {
        key: 'MTO-1842',
        summary: '[MTO][Prepress Backoffice] Non-MVP - Saved filters for prepress seniors',
        description: `Feature: Saved filters for prepress seniors\n\nAs a prepress senior\nI want to save my frequently used filters\nSo that I can quickly apply them without reconfiguring each time\n\nBackground:\nGiven I am logged in as a prepress senior\nAnd I have access to the prepress backoffice system\n\nScenario: Save a new filter\nGiven I am on the filter configuration page\nWhen I configure search criteria with specific parameters\nAnd I click "Save Filter" button\nAnd I enter a filter name "My Daily Tasks"\nThen the filter should be saved successfully\nAnd I should see "Filter saved successfully" message\nAnd the filter should appear in my saved filters list\n\nScenario: Apply saved filter\nGiven I have at least one saved filter named "My Daily Tasks"\nWhen I navigate to the main prepress page\nAnd I select "My Daily Tasks" from saved filters dropdown\nThen the filter should be applied automatically\nAnd I should see only tasks matching the saved criteria\nAnd the filter name should be displayed as active`,
        issueType: 'Story',
        priority: 'Medium',
        status: 'To Do',
        assignee: 'John Doe',
        labels: ['prepress', 'backoffice', 'filters'],
        components: ['Prepress Module'],
        customFields: {}
    }
];
