import { JiraConfig } from './jira-client';

// Jira configuration
// You can set these as environment variables or update them directly
export const JIRA_CONFIG: JiraConfig = {
    url: process.env.JIRA_URL || 'https://midoceanbrands.atlassian.net',
    email: process.env.JIRA_EMAIL || 'd.popi@levi9.com',
    token: process.env.JIRA_TOKEN || 'ATATT3xFfGF0sIWx6UL-48ZgqVdRjwak2dSbHHTj50Qv_b16EI0mXEQ3OVDYxnW_vf-Da4rie_iPdCapi6_hja5yRWxHl8bo5EQWhEUchWR9xNbYXroFp9GUzRfd9Jw-7HRlO1MlbpOo4HcSTUrMD8swm-fYoWgKbe0BAkBZCLWsBLADz-P1ubY=1EF0D65A',
    defaultBoardId: process.env.JIRA_BOARD_ID || 28, // Board ID iz URL-a
    projectKey: 'MTO' // Project key iz URL-a
};

// Check if Jira is configured
export const isJiraConfigured = (): boolean => {
    return !!(JIRA_CONFIG.url && JIRA_CONFIG.email && JIRA_CONFIG.token);
};

// Get singleton Jira client instance
let jiraClientInstance: any = null;

export const getJiraClient = async () => {
    if (!isJiraConfigured()) {
        return null;
    }

    if (!jiraClientInstance) {
        const { JiraClient } = await import('./jira-client');
        jiraClientInstance = new JiraClient(JIRA_CONFIG);
        console.log('Jira client initialized with URL:', JIRA_CONFIG.url);
    }

    return jiraClientInstance;
};