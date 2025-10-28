const axios = require('axios');

class JiraClient {
    constructor(config) {
        this.config = config;

        // Create axios instance with basic auth - use Jira Software REST API for agile
        this.client = axios.create({
            baseURL: `${config.url}/rest/agile/1.0`,
            auth: {
                username: config.email,
                password: config.token
            },
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });

        // Also create client for regular Jira API
        this.jiraClient = axios.create({
            baseURL: `${config.url}/rest/api/3`,
            auth: {
                username: config.email,
                password: config.token
            },
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
    }

    /**
     * Test connection to Jira
     */
    async testConnection() {
        try {
            console.log('Testing Jira connection...');
            const response = await this.jiraClient.get('/myself');
            console.log(`Connected as: ${response.data.displayName} (${response.data.emailAddress})`);
            return {
                success: true,
                user: {
                    name: response.data.displayName,
                    email: response.data.emailAddress
                }
            };
        } catch (error) {
            console.error('Jira connection failed:', error.message);
            return {
                success: false,
                error: error.response?.data?.errorMessages?.[0] || error.message
            };
        }
    }

    /**
     * Test specific board access
     */
    async testBoardAccess(boardId) {
        try {
            console.log(`Testing access to board ${boardId}...`);
            const response = await this.client.get(`/board/${boardId}`);
            console.log(`Board found: ${response.data.name} (Type: ${response.data.type})`);
            return {
                success: true,
                board: {
                    id: response.data.id,
                    name: response.data.name,
                    type: response.data.type,
                    projectKey: response.data.location?.projectKey
                }
            };
        } catch (error) {
            console.error(`Board ${boardId} access failed:`, error.message);
            return {
                success: false,
                error: error.response?.data?.errorMessages?.[0] || error.message
            };
        }
    }

    /**
     * Get all boards accessible to the user
     */
    async getBoards() {
        try {
            const response = await this.client.get('/board', {
                params: {
                    type: 'scrum' // Focus on Scrum boards that have sprints
                }
            });

            return {
                success: true,
                boards: response.data.values.map(board => ({
                    id: board.id,
                    name: board.name,
                    type: board.type,
                    projectKey: board.location?.projectKey
                }))
            };
        } catch (error) {
            console.error('Error fetching boards:', error.message);
            return {
                success: false,
                error: error.response?.data?.errorMessages?.[0] || error.message
            };
        }
    }

    /**
     * Get active sprints for a board
     */
    async getActiveSprints(boardId) {
        try {
            const response = await this.client.get(`/board/${boardId}/sprint`, {
                params: {
                    state: 'active,future' // Get active and future sprints
                }
            });

            return {
                success: true,
                sprints: response.data.values.map(sprint => ({
                    id: sprint.id,
                    name: sprint.name,
                    state: sprint.state,
                    startDate: sprint.startDate,
                    endDate: sprint.endDate,
                    completeDate: sprint.completeDate,
                    goal: sprint.goal
                }))
            };
        } catch (error) {
            console.error('Error fetching sprints:', error.message);
            return {
                success: false,
                error: error.response?.data?.errorMessages?.[0] || error.message
            };
        }
    }

    /**
     * Get all sprints for a board (including closed ones)
     */
    async getAllSprints(boardId) {
        try {
            const response = await this.client.get(`/board/${boardId}/sprint`, {
                params: {
                    maxResults: 100
                }
            });

            return {
                success: true,
                sprints: response.data.values.map(sprint => ({
                    id: sprint.id,
                    name: sprint.name,
                    state: sprint.state,
                    startDate: sprint.startDate,
                    endDate: sprint.endDate,
                    completeDate: sprint.completeDate,
                    goal: sprint.goal
                }))
            };
        } catch (error) {
            console.error('Error fetching all sprints:', error.message);
            return {
                success: false,
                error: error.response?.data?.errorMessages?.[0] || error.message
            };
        }
    }

    /**
     * Get tickets from a specific sprint (excluding bugs)
     */
    async getSprintTickets(sprintId, boardId) {
        try {
            const response = await this.client.get(`/board/${boardId}/sprint/${sprintId}/issue`, {
                params: {
                    maxResults: 100,
                    jql: `issuetype NOT IN ("Bug")`,
                    fields: [
                        'summary',
                        'description',
                        'issuetype',
                        'priority',
                        'status',
                        'assignee',
                        'labels',
                        'components',
                        'sprint',
                        'storyPoints',
                        'fixVersions'
                    ].join(',')
                }
            });

            const tickets = response.data.issues.map(issue => this.mapIssueToTicket(issue));

            return {
                success: true,
                tickets,
                total: response.data.total
            };
        } catch (error) {
            console.error('Error fetching sprint tickets:', error.message);
            return {
                success: false,
                error: error.response?.data?.errorMessages?.[0] || error.message
            };
        }
    }

    /**
     * Get current active tickets from a board (current sprint + open backlog items)
     */
    async getBoardTickets(boardId) {
        try {
            console.log(`Fetching active tickets for board ${boardId}...`);

            // First try to get tickets from active sprint
            try {
                const activeSprintsResult = await this.getActiveSprints(boardId);
                if (activeSprintsResult.success && activeSprintsResult.sprints.length > 0) {
                    const activeSprint = activeSprintsResult.sprints.find(s => s.state === 'active');
                    if (activeSprint) {
                        console.log(`Found active sprint: ${activeSprint.name}`);
                        return await this.getSprintTickets(activeSprint.id, boardId);
                    }
                }
            } catch (sprintError) {
                console.log('No active sprint found, falling back to board filter');
            }

            // Fallback: get open tickets from board (not closed/done), excluding bugs
            const response = await this.client.get(`/board/${boardId}/issue`, {
                params: {
                    maxResults: 50,
                    jql: `status NOT IN ("Done", "Closed", "Resolved") AND issuetype NOT IN ("Bug") ORDER BY updated DESC`,
                    fields: [
                        'summary',
                        'description',
                        'issuetype',
                        'priority',
                        'status',
                        'assignee',
                        'labels',
                        'components',
                        'sprint',
                        'storyPoints',
                        'fixVersions'
                    ].join(',')
                }
            });

            console.log(`Found ${response.data.issues.length} active tickets from board ${boardId}`);
            const tickets = response.data.issues.map(issue => this.mapIssueToTicket(issue));

            return {
                success: true,
                tickets,
                total: response.data.total
            };
        } catch (error) {
            console.error('Error fetching board tickets:', error.message);
            console.error('Error details:', error.response?.data);

            // Fallback: try to get tickets by project key
            try {
                console.log(`Trying fallback approach for board ${boardId}...`);
                return await this.getBoardTicketsByProject(boardId);
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError.message);
                return {
                    success: false,
                    error: error.response?.data?.errorMessages?.[0] || error.message
                };
            }
        }
    }

    /**
     * Fallback method to get board tickets by finding the project key first
     */
    async getBoardTicketsByProject(boardId) {
        try {
            // First get board details to find project key
            const boardResponse = await this.client.get(`/board/${boardId}`);
            const projectKey = boardResponse.data.location?.projectKey;

            if (!projectKey) {
                throw new Error('Could not determine project key for board');
            }

            console.log(`Found project key: ${projectKey} for board ${boardId}`);

            // Use JQL to get tickets from this project
            const jql = `project = "${projectKey}" ORDER BY updated DESC`;
            return await this.getTicketsByJQL(jql, 50);

        } catch (error) {
            console.error('Error in fallback method:', error.message);
            throw error;
        }
    }

    /**
     * Get tickets using JQL (Jira Query Language)
     */
    async getTicketsByJQL(jql, maxResults = 50) {
        try {
            const response = await this.client.get('/search', {
                params: {
                    jql,
                    maxResults,
                    fields: [
                        'summary',
                        'description',
                        'issuetype',
                        'priority',
                        'status',
                        'assignee',
                        'labels',
                        'components',
                        'sprint',
                        'storyPoints'
                    ].join(',')
                }
            });

            const tickets = response.data.issues.map(issue => this.mapIssueToTicket(issue));

            return {
                success: true,
                tickets,
                total: response.data.total
            };
        } catch (error) {
            console.error('Error fetching tickets by JQL:', error.message);
            return {
                success: false,
                error: error.response?.data?.errorMessages?.[0] || error.message
            };
        }
    }

    /**
     * Get a specific ticket by key
     */
    async getTicket(ticketKey) {
        try {
            const response = await this.client.get(`/issue/${ticketKey}`, {
                params: {
                    fields: [
                        'summary',
                        'description',
                        'issuetype',
                        'priority',
                        'status',
                        'assignee',
                        'labels',
                        'components',
                        'sprint'
                    ].join(',')
                }
            });

            return {
                success: true,
                ticket: this.mapIssueToTicket(response.data)
            };
        } catch (error) {
            console.error(`Error fetching ticket ${ticketKey}:`, error.message);
            return {
                success: false,
                error: error.response?.data?.errorMessages?.[0] || error.message
            };
        }
    }

    /**
     * Map Jira issue response to simplified ticket format
     */
    mapIssueToTicket(issue) {
        const fields = issue.fields;

        const ticket = {
            key: issue.key,
            summary: fields.summary || '',
            description: this.extractDescription(fields.description),
            issueType: fields.issuetype?.name || '',
            priority: fields.priority?.name || 'Medium',
            status: fields.status?.name || '',
            assignee: fields.assignee?.displayName || fields.assignee?.name,
            labels: Array.isArray(fields.labels) ? fields.labels : [],
            components: Array.isArray(fields.components)
                ? fields.components.map(c => c.name)
                : [],
            sprint: this.extractSprintInfo(fields.sprint),
            storyPoints: fields.storyPoints || null,
            customFields: this.extractCustomFields(fields)
        };

        // Log first few tickets to debug description parsing
        if (Math.random() < 0.2) { // Log ~20% of tickets to avoid spam
            console.log(`\n--- JIRA TICKET DEBUG: ${ticket.key} ---`);
            console.log('Summary:', ticket.summary);
            console.log('Description length:', ticket.description ? ticket.description.length : 0);
            console.log('Description preview:', ticket.description ? ticket.description.substring(0, 200) + '...' : 'NO DESCRIPTION');
            console.log('Original description type:', typeof fields.description, fields.description ? 'HAS_CONTENT' : 'EMPTY');
            console.log('Issue type:', ticket.issueType);
        }

        return ticket;
    }

    /**
     * Extract description text from various Jira description formats
     */
    extractDescription(description) {
        if (!description) return '';

        // Handle Atlassian Document Format (ADF)
        if (description.content && Array.isArray(description.content)) {
            return this.extractTextFromADF(description.content);
        }

        // Handle plain text description
        if (typeof description === 'string') {
            return description;
        }

        return '';
    }

    /**
     * Extract text from Atlassian Document Format (ADF)
     */
    extractTextFromADF(content) {
        let text = '';

        for (const block of content) {
            if (block.type === 'paragraph' && block.content) {
                for (const inline of block.content) {
                    if (inline.type === 'text' && inline.text) {
                        text += inline.text + ' ';
                    }
                }
                text += '\n';
            } else if (block.type === 'codeBlock' && block.content) {
                for (const inline of block.content) {
                    if (inline.type === 'text' && inline.text) {
                        text += inline.text + '\n';
                    }
                }
            }
        }

        return text.trim();
    }

    /**
     * Extract sprint information
     */
    extractSprintInfo(sprintField) {
        if (!sprintField) return null;

        // Sprint field can be an array or single object
        const sprints = Array.isArray(sprintField) ? sprintField : [sprintField];
        const activeSprint = sprints.find(s => s.state === 'active') || sprints[0];

        if (activeSprint) {
            return {
                id: activeSprint.id,
                name: activeSprint.name,
                state: activeSprint.state
            };
        }

        return null;
    }

    /**
     * Extract custom fields from issue
     */
    extractCustomFields(fields) {
        const customFields = {};

        for (const [key, value] of Object.entries(fields)) {
            if (key.startsWith('customfield_')) {
                customFields[key] = value;
            }
        }

        return customFields;
    }
}

module.exports = { JiraClient };