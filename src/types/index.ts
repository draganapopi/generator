export interface JiraTicket {
    key: string;
    summary: string;
    description: string;
    issueType: string;
    priority: string;
    status: string;
    assignee?: string;
    labels: string[];
    components: string[];
    customFields: Record<string, any>;
}

export interface TestStep {
    step: number;
    action: string;
    expectedResult: string;
}

export interface TestCase {
    id: string;
    title: string;
    description: string;
    preconditions: string[];
    steps: TestStep[];
    expectedResult: string;
    priority: string;
    linkedTicket: string;
    // Status lifecycle: pending (initial) -> approved | rejected; 'draft' reserved for manual edits if introduced later.
    status?: 'pending' | 'approved' | 'rejected' | 'draft';
}

export interface JiraConfig {
    url: string;
    email: string;
    token: string;
    projectKey?: string;
}

export interface TestCaseConfig {
    templateFile: string;
    outputDirectory: string;
    outputFormat: 'yaml' | 'json' | 'csv';
}

export interface GherkinScenario {
    title: string;
    given: string[];
    when: string[];
    then: string[];
    background?: string[];
    examples?: Array<{ [key: string]: string }>;
    tags?: string[];
}

export interface GherkinFeature {
    title: string;
    description: string;
    scenarios: GherkinScenario[];
    background?: string[];
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}