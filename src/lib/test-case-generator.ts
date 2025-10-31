import { JiraTicket } from './jira-client';
import * as fs from 'fs';
import * as path from 'path';

// Interfaces for instruction file parsing
export interface InstructionFileData {
    userRoles: ApplicationUserRole[];
    components: ApplicationComponent[];
    scenarioStrategies: ScenarioStrategy[];
    contentPatterns: ContentPattern[];
    stepGenerationGuidelines: StepGenerationGuideline[];
}

export interface ApplicationUserRole {
    name: string;
    capabilities: string[];
    restrictions: string[];
    accessibleComponents: string[];
}

export interface ApplicationComponent {
    name: string;
    description: string;
    accessibleBy: string[];
    functionality: string[];
}

export interface ScenarioStrategy {
    ticketType: string;
    requirements: string[];
    scenarios: string[];
    forbidden: string[];
}

export interface ContentPattern {
    name: string;
    keywords: string[];
    testGuidelines: string[];
}

export interface StepGenerationGuideline {
    changeType: string;
    steps: string[];
}

export interface UserStory {
    userRole: string | null;
    goal: string | null;
    benefit: string | null;
}

export interface TestStep {
    step: number;
    action: string;
    expectedResult: string;
}

export interface TestScenario {
    title: string;
    userRole: string;
    type: string;
    preconditions: string[];
    steps: TestStep[];
    acceptanceCriteria: string[];
}

export interface AnalysisResult {
    userStory: UserStory;
    acceptanceCriteria: string[];
    technicalNotes: string[];
    dataRequirements: string[];
    businessRules: string[];
    scenarios: TestScenario[];
}

export interface GherkinScenario {
    title: string;
    steps: Array<{
        type: string;
        text: string;
    }>;
    givens: string[];
    whens: string[];
    thens: string[];
    ands: string[];
}

export interface ChangeInfo {
    action: string | null;
    actionType: string | null;
    target: string | null;
}

export interface TestCase {
    id: string;
    title: string;
    description: string;
    userRole: string;
    testType: string;
    userStory: UserStory;
    preconditions: string[];
    steps: TestStep[];
    acceptanceCriteria: string[];
    expectedResult: string;
    priority: string;
    linkedTicket: string;
    status: string;
    assignee?: string;
    components: string[];
    technicalNotes: string[];
    dataRequirements: string[];
    businessRules: string[];
}

// Mock data for development
// mockTickets moved to separate file `mock-tickets.ts` to reduce bundle size and decouple generator logic.

// Enhanced Content-Aware parser for real ticket analysis
export class ContentAwareParser {
    private instructionData: InstructionFileData | null = null;

    constructor() {
        this.loadInstructionFile();
    }

    private loadInstructionFile(): void {
        try {
            const instructionPath = path.join(process.cwd(), '.github', 'instructions', 'test cases.instructions.md');
            if (fs.existsSync(instructionPath)) {
                const content = fs.readFileSync(instructionPath, 'utf-8');
                this.instructionData = this.parseInstructionFile(content);
                console.log('Loaded instruction file with:', {
                    userRoles: this.instructionData?.userRoles?.length || 0,
                    components: this.instructionData?.components?.length || 0,
                    patterns: this.instructionData?.contentPatterns?.length || 0
                });
            } else {
                console.warn('Instruction file not found, using fallback behavior');
            }
        } catch (error) {
            console.error('Error loading instruction file:', error);
        }
    }

    private parseInstructionFile(content: string): InstructionFileData {
        const lines = content.split('\n');
        const data: InstructionFileData = {
            userRoles: [],
            components: [],
            scenarioStrategies: [],
            contentPatterns: [],
            stepGenerationGuidelines: []
        };

        let currentSection = '';
        let currentUserRole: ApplicationUserRole | null = null;
        let currentComponent: ApplicationComponent | null = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Parse user roles section
            if (line.includes('Application-Specific User Roles')) {
                currentSection = 'userRoles';
                continue;
            }

            // Parse components section  
            if (line.includes('Application Components')) {
                currentSection = 'components';
                continue;
            }

            // Parse content patterns section
            if (line.includes('Content-Specific Patterns')) {
                currentSection = 'patterns';
                continue;
            }

            // Parse user roles
            if (currentSection === 'userRoles') {
                if (line.startsWith('**Customer**') || line.startsWith('**Customer Care**') || line.startsWith('**Prepress**')) {
                    // Save previous role if exists
                    if (currentUserRole) {
                        data.userRoles.push(currentUserRole);
                    }

                    const roleName = line.replace(/\*\*/g, '').toLowerCase();
                    currentUserRole = {
                        name: roleName === 'customer care' ? 'customer-care' : roleName,
                        capabilities: [],
                        restrictions: [],
                        accessibleComponents: []
                    };
                } else if (currentUserRole && line.startsWith('- ')) {
                    const capability = line.replace('- ', '').trim();
                    if (capability.includes('Access limited to') || capability.includes('Restricted to')) {
                        currentUserRole.restrictions.push(capability);
                    } else if (capability.includes('Access to')) {
                        // Extract components from access description
                        const components = this.extractComponentsFromText(capability);
                        currentUserRole.accessibleComponents.push(...components);
                        currentUserRole.capabilities.push(capability);
                    } else {
                        currentUserRole.capabilities.push(capability);
                    }
                }
            }

            // Parse components
            if (currentSection === 'components') {
                if (line.startsWith('**') && line.endsWith('**') && !line.includes('Application Components')) {
                    // Save previous component if exists
                    if (currentComponent) {
                        data.components.push(currentComponent);
                    }

                    const componentName = line.replace(/\*\*/g, '');
                    currentComponent = {
                        name: componentName,
                        description: '',
                        accessibleBy: [],
                        functionality: []
                    };
                } else if (currentComponent && line.startsWith('- ')) {
                    const functionality = line.replace('- ', '').trim();
                    if (functionality.includes('Accessible by') || functionality.includes('Restricted to')) {
                        // Extract roles from accessibility description
                        const roles = this.extractRolesFromText(functionality);
                        currentComponent.accessibleBy.push(...roles);
                    } else {
                        currentComponent.functionality.push(functionality);
                    }
                }
            }

            // Parse content patterns
            if (currentSection === 'patterns') {
                if (line.startsWith('### ')) {
                    const patternName = line.replace('### ', '').trim();
                    const pattern: ContentPattern = {
                        name: patternName.toLowerCase().replace(/\s+/g, '-'),
                        keywords: this.extractKeywordsFromPatternName(patternName),
                        testGuidelines: []
                    };

                    // Look ahead for guidelines
                    for (let j = i + 1; j < lines.length && j < i + 10; j++) {
                        const nextLine = lines[j].trim();
                        if (nextLine.startsWith('- ')) {
                            pattern.testGuidelines.push(nextLine.replace('- ', ''));
                        } else if (nextLine.startsWith('### ') || nextLine === '') {
                            break;
                        }
                    }

                    data.contentPatterns.push(pattern);
                }
            }
        }

        // Save the last items
        if (currentUserRole) data.userRoles.push(currentUserRole);
        if (currentComponent) data.components.push(currentComponent);

        return data;
    }

    private extractComponentsFromText(text: string): string[] {
        const components = [];
        const componentNames = ['Configurator', 'Category Component', 'Communication History', 'Order Activity', 'Backoffice Portal', 'Thank You Page'];

        for (const component of componentNames) {
            if (text.toLowerCase().includes(component.toLowerCase())) {
                components.push(component);
            }
        }

        return components;
    }

    private extractRolesFromText(text: string): string[] {
        const roles = [];
        if (text.toLowerCase().includes('customer care')) roles.push('customer-care');
        if (text.toLowerCase().includes('customer') && !text.toLowerCase().includes('customer care')) roles.push('customer');
        if (text.toLowerCase().includes('prepress')) roles.push('prepress');
        return roles;
    }

    private extractKeywordsFromPatternName(patternName: string): string[] {
        const keywords = [];
        const lowerName = patternName.toLowerCase();

        if (lowerName.includes('product configuration')) {
            keywords.push('configurator', 'product config', 'configuration');
        }
        if (lowerName.includes('order management')) {
            keywords.push('order', 'orders', 'order creation', 'order modification');
        }
        if (lowerName.includes('authentication')) {
            keywords.push('auth', 'login', 'authentication', 'security');
        }
        if (lowerName.includes('filter')) {
            keywords.push('filter', 'search', 'saved filter');
        }
        if (lowerName.includes('backoffice')) {
            keywords.push('backoffice', 'admin portal', 'prepress portal');
        }

        return keywords;
    }

    parseTicketContent(description: string, summary: string, issueType: string): AnalysisResult | null {
        if (!description) return null;

        const analysisResult: AnalysisResult = {
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

    extractUserStory(description: string): UserStory {
        const lines = description.split('\n').map(line => line.trim());
        let userRole: string | null = null;
        let goal: string | null = null;
        let benefit: string | null = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Extract role from "as" statements - support more variations
            if (line.match(/^\*?as\*?\s/i) || line.match(/^\*?as a\*?\s/i)) {
                const extractedRole = line.replace(/^\*?(as\s?a?)\*?\s/i, '').replace(/\*/g, '').trim();
                userRole = this.mapToApplicationRole(extractedRole);
            }

            // Extract goal from "i want to" statements
            if (line.match(/^\*?i want to\*?\s/i)) {
                goal = line.replace(/^\*?i want to\*?\s/i, '').replace(/\*/g, '').trim();
            }

            // Extract benefit from "so that" statements
            if (line.match(/^\*?so that\*?\s/i)) {
                benefit = line.replace(/^\*?so that\*?\s/i, '').replace(/\*/g, '').trim();
            }

            // Also handle "and" continuation for benefit
            if (line.match(/^\*?and\*?\s/i) && benefit && !goal) {
                benefit += ' ' + line.replace(/^\*?and\*?\s/i, '').replace(/\*/g, '').trim();
            }
        }

        return { userRole, goal, benefit };
    }

    // Helper method to map generic roles to application-specific roles
    mapToApplicationRole(role: string): string {
        if (!role) return 'customer';

        const lowerRole = role.toLowerCase();

        // Use instruction file data if available
        if (this.instructionData?.userRoles) {
            for (const userRole of this.instructionData.userRoles) {
                // Check direct match first
                if (lowerRole === userRole.name || lowerRole === userRole.name.replace('-', ' ')) {
                    return userRole.name;
                }

                // Check against role capabilities/keywords
                const roleKeywords = this.getRoleKeywords(userRole.name);
                for (const keyword of roleKeywords) {
                    if (lowerRole.includes(keyword)) {
                        return userRole.name;
                    }
                }
            }
        }

        // Fallback to hardcoded mapping if instruction file not available
        if (lowerRole.includes('prepress') || lowerRole.includes('admin') || lowerRole.includes('administrator') ||
            lowerRole.includes('operator') || lowerRole.includes('staff')) {
            return 'prepress';
        }

        if (lowerRole.includes('customer care') || lowerRole.includes('support') || lowerRole.includes('agent') ||
            lowerRole.includes('representative') || lowerRole.includes('assistant') || lowerRole.includes('service')) {
            return 'customer-care';
        }

        if (lowerRole.includes('customer') || lowerRole.includes('user') || lowerRole.includes('client') ||
            lowerRole.includes('buyer') || lowerRole.includes('end user') || lowerRole.includes('visitor')) {
            return 'customer';
        }

        // For specific application roles mentioned directly
        if (lowerRole === 'prepress' || lowerRole === 'prepress senior') return 'prepress';
        if (lowerRole === 'customer-care' || lowerRole === 'customer care') return 'customer-care';
        if (lowerRole === 'customer') return 'customer';

        // Special handling for technical roles - they should be mapped based on context
        if (lowerRole.includes('backend') || lowerRole.includes('developer') ||
            lowerRole.includes('senior') || lowerRole.includes('lead') || lowerRole.includes('manager')) {
            // For technical tickets, map to customer (as general user) unless explicitly prepress-related
            return 'customer';
        }

        // Default fallback
        return 'customer';
    }

    private getRoleKeywords(roleName: string): string[] {
        switch (roleName) {
            case 'customer':
                return ['customer', 'user', 'client', 'buyer', 'end user', 'visitor'];
            case 'customer-care':
                return ['customer care', 'support', 'agent', 'representative', 'assistant', 'service'];
            case 'prepress':
                return ['prepress', 'admin', 'administrator', 'operator', 'staff', 'backend', 'senior'];
            default:
                return [];
        }
    }

    // Detect application components based on ticket content
    detectComponents(description: string, summary: string, issueType: string): string[] {
        const text = (description + ' ' + summary).toLowerCase();
        const components: Set<string> = new Set();

        // Use instruction file data if available
        if (this.instructionData?.components) {
            for (const component of this.instructionData.components) {
                // Check direct component name mentions
                if (text.includes(component.name.toLowerCase())) {
                    components.add(component.name);
                    continue;
                }

                // Check functionality keywords
                for (const functionality of component.functionality) {
                    const keywords = this.extractKeywordsFromFunctionality(functionality);
                    for (const keyword of keywords) {
                        if (text.includes(keyword.toLowerCase())) {
                            components.add(component.name);
                            break;
                        }
                    }
                    if (components.has(component.name)) break;
                }
            }
        } else {
            // Fallback to hardcoded component patterns if instruction file not available
            const componentPatterns = {
                'Configurator': [
                    'configurator', 'configuration', 'product config', 'configure product',
                    'quantity selection', 'logo addition', 'address specification',
                    'shipping option', 'order creation', 'edit mode'
                ],
                'Category Component': [
                    'category', 'categories', 'product browse', 'product catalog',
                    'categorization', 'browse products'
                ],
                'Communication History': [
                    'communication history', 'order history', 'order details',
                    'order information', 'ch ', ' ch', 'history'
                ],
                'Order Activity': [
                    'order activity', 'order actions', 'order status', 'proof approval',
                    'proof rejection', 'order modification', 'activity tracking'
                ],
                'Backoffice Portal': [
                    'backoffice', 'back office', 'portal', 'admin portal',
                    'prepress portal', 'backend system', 'administrative'
                ],
                'Thank You Page': [
                    'thank you', 'thanks page', 'confirmation page',
                    'order confirmation', 'success page', 'v2'
                ]
            };

            // Check for explicit component mentions in summary or description
            for (const [component, patterns] of Object.entries(componentPatterns)) {
                for (const pattern of patterns) {
                    if (text.includes(pattern)) {
                        components.add(component);
                        break;
                    }
                }
            }
        }

        // Role-based component inference using instruction data
        const userStory = this.extractUserStory(description);
        if (userStory.userRole && this.instructionData?.userRoles) {
            const roleData = this.instructionData.userRoles.find(r => r.name === userStory.userRole);
            if (roleData && components.size === 0) {
                // Add default accessible components for the role
                roleData.accessibleComponents.forEach(comp => components.add(comp));
            }
        } else {
            // Fallback role-based inference
            if (userStory.userRole === 'prepress') {
                components.add('Backoffice Portal');
            } else if (userStory.userRole === 'customer' || userStory.userRole === 'customer-care') {
                // Default web components for customer roles
                if (components.size === 0) {
                    components.add('Configurator');
                }
            }
        }

        // Location-based component detection
        const locations = this.extractTestLocations(description);
        for (const location of locations) {
            const lowerLocation = location.toLowerCase();
            if (lowerLocation.includes('backoffice') || lowerLocation.includes('portal')) {
                components.add('Backoffice Portal');
            }
            if (lowerLocation.includes('order details') || lowerLocation.includes('order overview')) {
                components.add('Communication History');
                components.add('Order Activity');
            }
            if (lowerLocation.includes('thank you')) {
                components.add('Thank You Page');
            }
        }

        // If no components detected, use default based on ticket type
        if (components.size === 0) {
            if (issueType === 'Bug') {
                components.add('Configurator'); // Most common component
            } else {
                components.add('Configurator');
            }
        }

        return Array.from(components);
    }

    private extractKeywordsFromFunctionality(functionality: string): string[] {
        const keywords = [];
        const lower = functionality.toLowerCase();

        // Extract meaningful keywords from functionality descriptions
        const words = lower.split(/\s+/);
        for (const word of words) {
            if (word.length > 3 && !['that', 'with', 'from', 'where', 'allows', 'enables', 'supports'].includes(word)) {
                keywords.push(word);
            }
        }

        // Add common variations
        if (lower.includes('configuration')) keywords.push('config', 'configure');
        if (lower.includes('order')) keywords.push('orders', 'ordering');
        if (lower.includes('product')) keywords.push('products');

        return keywords;
    }

    // Detect content-specific patterns for specialized test generation
    detectContentPatterns(description: string, summary: string, issueType: string): string[] {
        const text = (description + ' ' + summary).toLowerCase();
        const patterns: Set<string> = new Set();

        // Use instruction file data if available
        if (this.instructionData?.contentPatterns) {
            for (const pattern of this.instructionData.contentPatterns) {
                for (const keyword of pattern.keywords) {
                    if (text.includes(keyword.toLowerCase())) {
                        patterns.add(pattern.name);
                        break;
                    }
                }
            }
        } else {
            // Fallback to hardcoded pattern detection if instruction file not available
            const patternMatchers = {
                'product-configuration': [
                    'configurator', 'product config', 'configuration', 'configure product',
                    'product options', 'quantity selection', 'logo upload', 'address specification',
                    'shipping options', 'product creation'
                ],
                'order-management': [
                    'order', 'orders', 'order creation', 'order modification', 'order status',
                    'order details', 'order history', 'order activity', 'order lifecycle',
                    'place order', 'create order', 'edit order'
                ],
                'role-based-access': [
                    'role', 'access', 'permission', 'restricted', 'authorization',
                    'customer access', 'prepress access', 'backoffice access', 'role-based',
                    'user role', 'access control'
                ],
                'order-number-formatting': [
                    'order number', 'order id', 'number format', 'leading zero',
                    'remove leading', 'format number', 'number display', 'id format'
                ],
                'filter-search': [
                    'filter', 'search', 'saved filter', 'search criteria', 'search functionality',
                    'filter configuration', 'filter management', 'saved searches'
                ],
                'authentication': [
                    'auth', 'login', 'logout', 'authentication', 'session', 'token',
                    'password', 'credential', 'security', 'jwt', 'login endpoint'
                ],
                'proof-workflow': [
                    'proof', 'approval', 'reject', 'proof approval', 'proof rejection',
                    'proof generation', 'proof delivery', 'artwork', 'proof workflow'
                ],
                'communication-workflow': [
                    'communication', 'notification', 'message', 'alert', 'email',
                    'customer care', 'support interaction', 'communication history'
                ],
                'cross-component-navigation': [
                    'navigate', 'navigation', 'redirect', 'link', 'edit mode',
                    'communication history to configurator', 'cross-component'
                ],
                'data-validation': [
                    'validation', 'validate', 'data validation', 'input validation',
                    'field validation', 'format validation', 'required field'
                ]
            };

            for (const [pattern, keywords] of Object.entries(patternMatchers)) {
                for (const keyword of keywords) {
                    if (text.includes(keyword)) {
                        patterns.add(pattern);
                        break;
                    }
                }
            }
        }

        // Special pattern detection based on issue type
        if (issueType === 'Bug') {
            patterns.add('regression-testing');
            patterns.add('error-handling');
        }

        // Location-based pattern detection
        const locations = this.extractTestLocations(description);
        if (locations.length > 1) {
            patterns.add('cross-location-consistency');
        }

        return Array.from(patterns);
    } extractExplicitGherkinScenarios(description: string): GherkinScenario[] {
        const scenarios: GherkinScenario[] = [];
        const lines = description.split('\n').map(line => line.trim());

        let currentScenario: GherkinScenario | null = null;
        let stepType: string | null = null;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            // Match scenario definitions
            if (line.match(/^\*?scenario\s*\d*\s*:/i)) {
                // Save previous scenario if exists
                if (currentScenario) {
                    scenarios.push(currentScenario);
                }

                const scenarioTitle = line.replace(/^\*?scenario\s*\d*\s*:\s*/i, '').replace(/\*/g, '').trim();
                currentScenario = {
                    title: scenarioTitle,
                    steps: [],
                    givens: [],
                    whens: [],
                    thens: [],
                    ands: []
                };
                continue;
            }

            // Match GIVEN/WHEN/THEN/AND statements
            if (line.match(/^\*?(GIVEN|WHEN|THEN|AND|IF)\s*:\s*/i)) {
                stepType = line.match(/^\*?(GIVEN|WHEN|THEN|AND|IF)\s*:\s*/i)![1].toUpperCase();
                const stepText = line.replace(/^\*?(GIVEN|WHEN|THEN|AND|IF)\s*:\s*/i, '').replace(/\*/g, '').trim();

                if (currentScenario) {
                    const step = { type: stepType, text: stepText };
                    currentScenario.steps.push(step);

                    // Also categorize by step type
                    switch (stepType) {
                        case 'GIVEN':
                            currentScenario.givens.push(stepText);
                            break;
                        case 'WHEN':
                            currentScenario.whens.push(stepText);
                            break;
                        case 'THEN':
                            currentScenario.thens.push(stepText);
                            break;
                        case 'AND':
                            currentScenario.ands.push(stepText);
                            break;
                        case 'IF':
                            currentScenario.givens.push(stepText); // Treat IF as precondition
                            break;
                    }
                }
                continue;
            }

            // Handle continuation lines (lines that extend the current step)
            if (currentScenario && currentScenario.steps.length > 0 && line && !line.startsWith('*') && stepType) {
                const lastStep = currentScenario.steps[currentScenario.steps.length - 1];
                lastStep.text += ' ' + line.trim();

                // Update the categorized arrays as well
                switch (lastStep.type) {
                    case 'GIVEN':
                        currentScenario.givens[currentScenario.givens.length - 1] += ' ' + line.trim();
                        break;
                    case 'WHEN':
                        currentScenario.whens[currentScenario.whens.length - 1] += ' ' + line.trim();
                        break;
                    case 'THEN':
                        currentScenario.thens[currentScenario.thens.length - 1] += ' ' + line.trim();
                        break;
                    case 'AND':
                        currentScenario.ands[currentScenario.ands.length - 1] += ' ' + line.trim();
                        break;
                }
            }
        }

        // Add the last scenario
        if (currentScenario) {
            scenarios.push(currentScenario);
        }

        return scenarios;
    }

    extractAcceptanceCriteria(description: string): string[] {
        const criteria: string[] = [];
        const lines = description.split('\n').map(line => line.trim());

        let inCriteriaSection = false;
        let currentList: string[] = [];

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

    extractTechnicalNotes(description: string): string[] {
        const notes: string[] = [];
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

    extractDataRequirements(description: string): string[] {
        const dataFields: string[] = [];
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

    extractBusinessRules(description: string): string[] {
        const rules: string[] = [];
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

    generateScenariosFromContent(description: string, summary: string, issueType: string): TestScenario[] {
        const userStory = this.extractUserStory(description);
        const acceptanceCriteria = this.extractAcceptanceCriteria(description);
        const technicalNotes = this.extractTechnicalNotes(description);
        const dataRequirements = this.extractDataRequirements(description);
        const explicitScenarios = this.extractExplicitGherkinScenarios(description);

        // Detect components ONLY based on explicit mentions in ticket
        const components = this.detectComponents(description, summary, issueType);

        const scenarios: TestScenario[] = [];

        // Check if we have user story format (Type 1 and Type 2)
        const hasUserStoryFormat = userStory.userRole && userStory.goal;

        // Check if we have explicit Gherkin scenarios (Type 2)
        const hasExplicitScenarios = explicitScenarios.length > 0;

        console.log('TICKET-SPECIFIC scenario analysis:', {
            hasUserRole: !!userStory.userRole,
            hasGoal: !!userStory.goal,
            hasBenefit: !!userStory.benefit,
            hasUserStoryFormat,
            hasExplicitScenarios,
            explicitScenariosCount: explicitScenarios.length,
            acceptanceCriteriaCount: acceptanceCriteria.length,
            components
        });

        // Type 2: Has both user story format AND explicit gherkin scenarios
        if (hasUserStoryFormat && hasExplicitScenarios) {
            console.log('Processing Type 2: User story with explicit Gherkin scenarios');

            // Combine all scenarios into ONE test case instead of separate ones
            const allSteps: TestStep[] = [];
            const allPreconditions: string[] = [];
            const allAcceptanceCriteria: string[] = [];
            let stepNumber = 1;

            explicitScenarios.forEach((scenario, index) => {
                // Add scenario title as a comment step if there are multiple scenarios
                if (explicitScenarios.length > 1) {
                    allSteps.push({
                        step: stepNumber++,
                        action: `--- ${scenario.title} ---`,
                        expectedResult: 'Scenario section identifier'
                    });
                }

                // Convert scenario steps and add to combined list
                const scenarioSteps = this.convertGherkinToTestSteps(scenario);
                scenarioSteps.forEach(step => {
                    allSteps.push({
                        step: stepNumber++,
                        action: step.action,
                        expectedResult: step.expectedResult
                    });
                });

                // Collect preconditions (avoid duplicates)
                scenario.givens.forEach(given => {
                    if (!allPreconditions.includes(given)) {
                        allPreconditions.push(given);
                    }
                });

                // Collect acceptance criteria (avoid duplicates)
                scenario.thens.forEach(then => {
                    if (!allAcceptanceCriteria.includes(then)) {
                        allAcceptanceCriteria.push(then);
                    }
                });
            });

            // Create ONE combined test case
            scenarios.push({
                title: explicitScenarios.length === 1
                    ? explicitScenarios[0].title
                    : `${userStory.userRole} can ${userStory.goal}`,
                userRole: userStory.userRole || 'customer',
                type: 'gherkin',
                preconditions: allPreconditions.length > 0 ? allPreconditions : [`User is logged in as ${userStory.userRole || 'customer'}`],
                steps: allSteps,
                acceptanceCriteria: allAcceptanceCriteria
            });
        }
        // Type 1: Has user story format but NO explicit gherkin scenarios
        else if (hasUserStoryFormat && !hasExplicitScenarios) {
            console.log('Processing Type 1: User story without explicit Gherkin scenarios - CREATING TICKET-SPECIFIC TEST CASES');

            // ONLY ONE main functional scenario based on user story and acceptance criteria
            scenarios.push({
                title: `${userStory.userRole} can ${userStory.goal}`,
                userRole: userStory.userRole || 'customer',
                type: 'functional',
                preconditions: this.generatePreconditions(userStory, issueType),
                steps: this.generateRoleAwareSteps(
                    userStory.goal!,
                    userStory.userRole || 'customer',
                    acceptanceCriteria,
                    components,
                    [] // No patterns - only ticket-specific
                ),
                acceptanceCriteria: acceptanceCriteria
            });

            // ONLY add additional scenarios if EXPLICITLY mentioned in acceptance criteria
            if (dataRequirements.length > 0) {
                scenarios.push({
                    title: 'Data requirements validation',
                    userRole: userStory.userRole || 'customer',
                    type: 'data-validation',
                    preconditions: [`User is logged in as ${userStory.userRole || 'customer'}`, 'System has required data access'],
                    steps: this.generateDataValidationSteps(dataRequirements),
                    acceptanceCriteria: dataRequirements
                });
            }

            // ONLY add technical scenarios if EXPLICITLY mentioned in ticket
            if (technicalNotes.length > 0) {
                scenarios.push({
                    title: 'Technical implementation verification',
                    userRole: userStory.userRole || 'customer',
                    type: 'technical',
                    preconditions: ['System is configured correctly', 'Technical requirements are implemented'],
                    steps: this.generateTechnicalSteps(technicalNotes),
                    acceptanceCriteria: technicalNotes
                });
            }

            // DO NOT automatically add role-based or cross-component scenarios unless explicitly mentioned
        }
        // Type 3: No user story format - will be handled by generateScenariosFromRequirements
        else {
            console.log('No user story format found, returning empty for Type 3 processing');
            return []; // Return empty to trigger non-Gherkin parsing
        }

        // ONLY add error handling scenarios if error handling is EXPLICITLY mentioned in acceptance criteria
        const hasErrorHandling = acceptanceCriteria.some(c =>
            c.toLowerCase().includes('error') ||
            c.toLowerCase().includes('validation') ||
            c.toLowerCase().includes('handling')
        );

        if (hasErrorHandling) {
            scenarios.push({
                title: 'Error handling verification',
                userRole: userStory.userRole || 'customer',
                type: 'error-handling',
                preconditions: [`User is logged in as ${userStory.userRole || 'customer'}`, 'System is in error-prone state'],
                steps: this.generateErrorHandlingSteps(userStory.goal || 'perform main functionality', acceptanceCriteria),
                acceptanceCriteria: ['Error messages are clear and helpful', 'System remains stable during errors']
            });
        }

        return scenarios;
    }

    // Generate role-specific access verification steps
    generateRoleAccessSteps(role: string, components: string[]): TestStep[] {
        const steps: TestStep[] = [];
        let stepNumber = 1;

        steps.push({
            step: stepNumber++,
            action: `Log in as ${role}`,
            expectedResult: `Successfully logged in with ${role} permissions`
        });

        if (role === 'customer') {
            steps.push({
                step: stepNumber++,
                action: 'Verify access to Configurator, Category Component, and Communication History',
                expectedResult: 'Customer can access all customer-facing components'
            });
            steps.push({
                step: stepNumber++,
                action: 'Verify Backoffice Portal is not accessible',
                expectedResult: 'Backoffice Portal is hidden or access is denied'
            });
        } else if (role === 'customer-care') {
            steps.push({
                step: stepNumber++,
                action: 'Verify access to all customer components plus customer care features',
                expectedResult: 'Customer care has extended functionality for assisting customers'
            });
            steps.push({
                step: stepNumber++,
                action: 'Verify ability to access and manipulate customer data',
                expectedResult: 'Customer care can assist with customer orders and data'
            });
        } else if (role === 'prepress') {
            steps.push({
                step: stepNumber++,
                action: 'Verify exclusive access to Backoffice Portal',
                expectedResult: 'Prepress can access administrative functions and Backoffice'
            });
            steps.push({
                step: stepNumber++,
                action: 'Verify limited or no access to customer-facing components',
                expectedResult: 'Prepress access is restricted to appropriate backend functions'
            });
        }

        return steps;
    }

    convertGherkinToTestSteps(gherkinScenario: GherkinScenario): TestStep[] {
        const steps: TestStep[] = [];
        let stepNumber = 1;

        // Process each step in the gherkin scenario
        gherkinScenario.steps.forEach(step => {
            let action = '';
            let expectedResult = '';

            switch (step.type) {
                case 'GIVEN':
                    action = `Ensure that ${step.text.toLowerCase()}`;
                    expectedResult = `Precondition "${step.text}" is satisfied`;
                    break;
                case 'WHEN':
                    action = step.text;
                    expectedResult = 'Action is completed successfully';
                    break;
                case 'THEN':
                    action = `Verify that ${step.text.toLowerCase()}`;
                    expectedResult = step.text;
                    break;
                case 'AND':
                    action = `Additionally, ${step.text.toLowerCase()}`;
                    expectedResult = `Condition "${step.text}" is met`;
                    break;
                case 'IF':
                    action = `Check if ${step.text.toLowerCase()}`;
                    expectedResult = `Condition "${step.text}" is evaluated correctly`;
                    break;
                default:
                    action = step.text;
                    expectedResult = 'Step is completed successfully';
            }

            steps.push({
                step: stepNumber++,
                action: action,
                expectedResult: expectedResult
            });
        });

        return steps;
    }

    // Enhanced method: Parse non-Gherkin tickets and extract what needs to be changed/tested
    generateScenariosFromRequirements(description: string, summary: string, issueType: string): TestScenario[] {
        const scenarios: TestScenario[] = [];
        const lines = description.split('\n').map(line => line.trim());

        // Extract what needs to be changed/implemented
        const changes = this.extractChanges(description, summary);
        const locations = this.extractTestLocations(description);
        const requirements = this.extractRequirements(description);

        console.log('Non-Gherkin parsing:', { changes, locations: locations.length, requirements: requirements.length });

        // Type 3: Simple description tickets - generate comprehensive test scenarios
        if (changes.action && locations.length > 0) {
            // Main functional test scenario
            scenarios.push({
                title: `Verify ${changes.action} in all specified locations`,
                userRole: 'user',
                type: 'functional',
                preconditions: this.generatePreconditionsFromChanges(changes, issueType),
                steps: this.generateStepsFromChanges(changes, locations),
                acceptanceCriteria: locations.map(loc => `${changes.action} is correctly implemented in ${loc}`)
            });

            // Add comprehensive verification scenario
            scenarios.push({
                title: `Comprehensive verification of ${changes.actionType} functionality`,
                userRole: 'user',
                type: 'verification',
                preconditions: ['User has access to all affected areas', 'Test data is available'],
                steps: this.generateComprehensiveVerificationSteps(changes, locations),
                acceptanceCriteria: [`All instances of ${changes.target} are ${changes.actionType}d correctly`]
            });
        }
        else if (requirements.length > 0) {
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
        else {
            // Fallback for tickets without clear structure
            scenarios.push({
                title: `Verify implementation described in ticket`,
                userRole: 'user',
                type: 'functional',
                preconditions: ['User has access to the system', 'Necessary test data is available'],
                steps: this.generateGenericStepsFromDescription(description, summary),
                acceptanceCriteria: ['Implementation matches the description in the ticket']
            });
        }

        // Add edge cases and negative testing if applicable
        if (changes.action && (changes.action.includes('remove') || changes.action.includes('change'))) {
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

    extractChanges(description: string, summary: string): ChangeInfo {
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
            const match = text.match(pattern);
            if (match) {
                const target = match[1]?.trim();
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

    extractTestLocations(description: string): string[] {
        const locations: string[] = [];
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

    extractRequirements(description: string): string[] {
        const requirements: string[] = [];
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

    generatePreconditionsFromChanges(changes: ChangeInfo, issueType: string): string[] {
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

    generateStepsFromChanges(changes: ChangeInfo, locations: string[]): TestStep[] {
        const steps: TestStep[] = [];
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

    generateStepsFromRequirements(requirements: string[]): TestStep[] {
        return requirements.map((req, index) => ({
            step: index + 1,
            action: `Verify that ${req.toLowerCase()}`,
            expectedResult: `Requirement "${req}" is correctly implemented`
        }));
    }

    generateComprehensiveVerificationSteps(changes: ChangeInfo, locations: string[]): TestStep[] {
        const steps: TestStep[] = [];
        let stepNumber = 1;

        // Initial verification step
        steps.push({
            step: stepNumber++,
            action: 'Navigate to the system and log in with appropriate permissions',
            expectedResult: 'User has access to all required areas'
        });

        // Test each location individually
        locations.forEach((location) => {
            steps.push({
                step: stepNumber++,
                action: `Navigate to ${location}`,
                expectedResult: `${location} is accessible and loads correctly`
            });

            steps.push({
                step: stepNumber++,
                action: `Verify that ${changes.target} has been ${changes.actionType}d in ${location}`,
                expectedResult: `${changes.target} shows the expected ${changes.actionType} behavior in ${location}`
            });
        });

        // Cross-location consistency check
        steps.push({
            step: stepNumber++,
            action: 'Compare the implementation across all tested locations',
            expectedResult: `${changes.action} is consistent across all locations`
        });

        // Final validation
        steps.push({
            step: stepNumber++,
            action: 'Perform end-to-end workflow testing across affected areas',
            expectedResult: 'All workflows function correctly with the implemented changes'
        });

        return steps;
    }

    generateGenericStepsFromDescription(description: string, summary: string): TestStep[] {
        const steps: TestStep[] = [];
        let stepNumber = 1;

        steps.push({
            step: stepNumber++,
            action: 'Navigate to the relevant system area based on ticket description',
            expectedResult: 'System area is accessible'
        });

        steps.push({
            step: stepNumber++,
            action: 'Review the current state before implementing changes',
            expectedResult: 'Current state is documented and understood'
        });

        steps.push({
            step: stepNumber++,
            action: 'Verify that the implementation matches the ticket description',
            expectedResult: 'All requirements from the ticket are properly implemented'
        });

        steps.push({
            step: stepNumber++,
            action: 'Test the functionality in different scenarios',
            expectedResult: 'Implementation works correctly in various use cases'
        });

        steps.push({
            step: stepNumber++,
            action: 'Perform regression testing on related functionality',
            expectedResult: 'No existing functionality is broken by the changes'
        });

        return steps;
    }

    generateEdgeCaseSteps(changes: ChangeInfo, locations: string[]): TestStep[] {
        const steps: TestStep[] = [];
        let stepNumber = 1;

        if (changes.actionType === 'remove' && changes.target?.includes('0')) {
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

    generatePreconditions(userStory: UserStory, issueType: string): string[] {
        const preconditions: string[] = [];

        // Use more standard precondition format
        preconditions.push('User is logged in into system');

        // Enhanced preconditions based on goal content
        if (userStory.goal && userStory.goal.includes('cancelled')) {
            preconditions.push('User is opening cancel order');
        } else if (userStory.goal && userStory.goal.includes('order')) {
            preconditions.push('Test orders are available in the system');
        }

        return preconditions;
    }

    // Role-aware step generation that considers user capabilities and restrictions
    generateRoleAwareSteps(goal: string, userRole: string, acceptanceCriteria: string[], components: string[], patterns: string[]): TestStep[] {
        const steps: TestStep[] = [];
        let stepNumber = 1;

        // Role-specific login and access steps
        steps.push({
            step: stepNumber++,
            action: `Log in as ${userRole}`,
            expectedResult: `User is successfully logged in with ${userRole} permissions`
        });

        // Role-specific navigation based on capabilities
        if (userRole === 'prepress') {
            steps.push({
                step: stepNumber++,
                action: 'Navigate to Backoffice Portal',
                expectedResult: 'Backoffice Portal is accessible and loads correctly'
            });
        } else if (userRole === 'customer' || userRole === 'customer-care') {
            // Customer and customer care have access to web components
            if (components.includes('Configurator')) {
                steps.push({
                    step: stepNumber++,
                    action: 'Navigate to Configurator',
                    expectedResult: 'Configurator interface is accessible and loads correctly'
                });
            }
            if (components.includes('Communication History')) {
                steps.push({
                    step: stepNumber++,
                    action: 'Navigate to Communication History',
                    expectedResult: 'Communication History is accessible and displays order information'
                });
            }
        }

        // Pattern-specific step generation - ONLY if patterns are provided and not empty
        if (patterns && patterns.length > 0) {
            if (patterns.includes('product-configuration')) {
                steps.push(...this.generateProductConfigurationSteps(stepNumber, userRole));
                stepNumber += 3;
            }

            if (patterns.includes('order-management')) {
                steps.push(...this.generateOrderManagementSteps(stepNumber, userRole));
                stepNumber += 3;
            }

            if (patterns.includes('proof-workflow') && userRole === 'prepress') {
                steps.push(...this.generateProofWorkflowSteps(stepNumber));
                stepNumber += 3;
            }

            if (patterns.includes('cross-component-navigation')) {
                steps.push(...this.generateCrossComponentNavigationSteps(stepNumber, userRole));
                stepNumber += 2;
            }

            // Goal-specific steps for specific patterns
            if (goal.includes('save') && goal.includes('filter')) {
                steps.push(...this.generateSaveFilterSteps(stepNumber, userRole));
                stepNumber += 4;
            }
        }

        // Basic goal-specific steps (always executed)
        if (goal.includes('see') || goal.includes('view')) {
            steps.push({
                step: stepNumber++,
                action: 'Verify the requested information is displayed',
                expectedResult: 'Information is correctly displayed according to user role permissions'
            });
        }

        // Acceptance criteria validation
        acceptanceCriteria.forEach((criteria) => {
            steps.push({
                step: stepNumber++,
                action: `Verify that ${criteria.toLowerCase()}`,
                expectedResult: `${criteria} is correctly implemented and accessible to ${userRole}`
            });
        });

        // Role-specific verification
        if (userRole === 'customer') {
            steps.push({
                step: stepNumber++,
                action: 'Verify customer-specific features are accessible and Backoffice features are not visible',
                expectedResult: 'Only customer-appropriate features are available'
            });
        } else if (userRole === 'customer-care') {
            steps.push({
                step: stepNumber++,
                action: 'Verify customer care can access all customer features plus additional support capabilities',
                expectedResult: 'Extended customer care functionality is available'
            });
        } else if (userRole === 'prepress') {
            steps.push({
                step: stepNumber++,
                action: 'Verify prepress has access to Backoffice portal and administrative functions',
                expectedResult: 'Backoffice functionality is fully accessible'
            });
        }

        return steps;
    }

    // Specialized step generators for different patterns
    generateProductConfigurationSteps(startStep: number, userRole: string): TestStep[] {
        const steps: TestStep[] = [];
        if (userRole === 'customer' || userRole === 'customer-care') {
            steps.push({
                step: startStep,
                action: 'Select product options and configure quantity',
                expectedResult: 'Product configuration interface responds correctly'
            });
            steps.push({
                step: startStep + 1,
                action: 'Add logo and specify shipping address',
                expectedResult: 'Logo upload and address specification work correctly'
            });
            steps.push({
                step: startStep + 2,
                action: 'Select shipping options and create order',
                expectedResult: 'Order creation process completes successfully'
            });
        }
        return steps;
    }

    generateOrderManagementSteps(startStep: number, userRole: string): TestStep[] {
        const steps: TestStep[] = [];
        if (userRole === 'customer' || userRole === 'customer-care') {
            steps.push({
                step: startStep,
                action: 'View order details in Communication History',
                expectedResult: 'Order information is displayed correctly'
            });
            steps.push({
                step: startStep + 1,
                action: 'Access Order Activity to see order actions and communications',
                expectedResult: 'Order Activity shows complete order history'
            });
            steps.push({
                step: startStep + 2,
                action: 'Test order modification capabilities if applicable',
                expectedResult: 'Order modifications work according to user role permissions'
            });
        } else if (userRole === 'prepress') {
            steps.push({
                step: startStep,
                action: 'Access order management in Backoffice Portal',
                expectedResult: 'Backoffice order management interface is accessible'
            });
            steps.push({
                step: startStep + 1,
                action: 'Update order status and add activity entries',
                expectedResult: 'Order status updates are processed correctly'
            });
            steps.push({
                step: startStep + 2,
                action: 'Generate and deliver proofs to customers',
                expectedResult: 'Proof generation and delivery process works correctly'
            });
        }
        return steps;
    }

    generateProofWorkflowSteps(startStep: number): TestStep[] {
        return [
            {
                step: startStep,
                action: 'Generate proof for customer approval',
                expectedResult: 'Proof is generated and sent to customer'
            },
            {
                step: startStep + 1,
                action: 'Process customer proof approval/rejection',
                expectedResult: 'Proof approval/rejection is handled correctly'
            },
            {
                step: startStep + 2,
                action: 'Update order status based on proof workflow',
                expectedResult: 'Order status reflects proof approval status'
            }
        ];
    }

    generateCrossComponentNavigationSteps(startStep: number, userRole: string): TestStep[] {
        const steps: TestStep[] = [];
        if (userRole === 'customer' || userRole === 'customer-care') {
            steps.push({
                step: startStep,
                action: 'Navigate from Communication History to Configurator in Edit mode',
                expectedResult: 'Navigation works correctly and Edit mode is activated'
            });
            steps.push({
                step: startStep + 1,
                action: 'Verify cross-component data consistency',
                expectedResult: 'Data is consistent across components'
            });
        }
        return steps;
    }

    generateSaveFilterSteps(startStep: number, userRole: string): TestStep[] {
        return [
            {
                step: startStep,
                action: 'Configure search criteria with specific parameters',
                expectedResult: 'Filter configuration interface accepts parameters'
            },
            {
                step: startStep + 1,
                action: 'Click "Save Filter" button and enter filter name',
                expectedResult: 'Filter saving process is initiated'
            },
            {
                step: startStep + 2,
                action: 'Verify filter is saved successfully',
                expectedResult: 'Filter appears in saved filters list'
            },
            {
                step: startStep + 3,
                action: 'Apply saved filter and verify functionality',
                expectedResult: 'Saved filter applies correctly and shows expected results'
            }
        ];
    }

    generateStepsFromGoal(goal: string, acceptanceCriteria: string[]): TestStep[] {
        const steps: TestStep[] = [];
        let stepNumber = 1;

        // Enhanced goal analysis with more specific patterns

        // Pattern for "see a card" or similar UI visibility goals
        if (goal.includes('see a card') || goal.includes('see card') || goal.includes('show card')) {
            const cardType = this.extractCardType(goal);

            steps.push({
                step: stepNumber++,
                action: 'User navigates to the page',
                expectedResult: 'User is on the page'
            });

            // Determine the specific area to check based on context
            if (goal.includes('communication history') || goal.includes('history') || acceptanceCriteria.some(c => c.includes('history'))) {
                steps.push({
                    step: stepNumber++,
                    action: 'User clicks on the Order Activity',
                    expectedResult: 'Tab Order Activity is opened'
                });
            }

            steps.push({
                step: stepNumber++,
                action: `User checks if ${cardType} is displayed`,
                expectedResult: `${cardType} is shown`
            });

            // Check design compliance if it's a visual component
            steps.push({
                step: stepNumber++,
                action: 'Check if card is according to design',
                expectedResult: 'Card is according to design'
            });

            return steps;
        }

        // Pattern for general viewing/seeing goals
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

        // Pattern for data synchronization goals
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

        // Pattern for creation goals
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

        // Pattern for improvement goals
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
        acceptanceCriteria.forEach((criteria) => {
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

    // Helper method to extract card type from goal
    extractCardType(goal: string): string {
        if (goal.includes('cancelled') || goal.includes('cancel')) {
            return 'card for Cancel order';
        }
        if (goal.includes('order')) {
            return 'card for order';
        }
        if (goal.includes('card mentioning')) {
            const match = goal.match(/card mentioning that (.+?)(?:\s|$)/);
            if (match) {
                return `card mentioning that ${match[1]}`;
            }
        }
        return 'card';
    }

    generateDataValidationSteps(dataRequirements: string[]): TestStep[] {
        return dataRequirements.map((requirement, index) => ({
            step: index + 1,
            action: `Verify that ${requirement.toLowerCase()} is captured and displayed correctly`,
            expectedResult: `${requirement} appears with correct format and data`
        }));
    }

    generateTechnicalSteps(technicalNotes: string[]): TestStep[] {
        return technicalNotes.map((note, index) => ({
            step: index + 1,
            action: `Verify that ${note.toLowerCase().replace(/^(for now|take a note)/, 'system')}`,
            expectedResult: `Technical requirement "${note}" is properly implemented`
        }));
    }

    generateErrorHandlingSteps(goal: string, acceptanceCriteria: string[]): TestStep[] {
        const steps: TestStep[] = [];
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

    // generateEnhancedLabels removed (labels feature dropped)
}

// Enhanced test case generator with real content analysis
export function generateTestCases(ticket: JiraTicket): TestCase[] {
    console.log(`\n=== Generating test cases for ${ticket.key} ===`);
    console.log('Ticket description:', ticket.description ? ticket.description.substring(0, 200) + '...' : 'NO DESCRIPTION');
    console.log('Ticket summary:', ticket.summary);
    console.log('Issue type:', ticket.issueType);

    const contentParser = new ContentAwareParser();
    const analysis = contentParser.parseTicketContent(ticket.description, ticket.summary, ticket.issueType);

    // Detect components and patterns for enhanced labeling
    const components = contentParser.detectComponents(ticket.description, ticket.summary, ticket.issueType);
    const patterns = contentParser.detectContentPatterns(ticket.description, ticket.summary, ticket.issueType);

    console.log('Analysis result:', {
        hasUserStory: !!analysis?.userStory?.userRole,
        scenariosCount: analysis?.scenarios?.length || 0,
        hasCriteria: analysis?.acceptanceCriteria?.length || 0,
        hasTechnicalNotes: analysis?.technicalNotes?.length || 0,
        components,
        patterns
    });

    if (!analysis || analysis.scenarios.length === 0) {
        console.log('Using fallback test case generation (no scenarios found)');
        return generateFallbackTestCase(ticket, components, patterns);
    }

    const testCases: TestCase[] = [];

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
            linkedTicket: ticket.key,
            status: 'pending',
            assignee: ticket.assignee,
            components: components.length > 0 ? components : ticket.components,
            // Additional metadata from ticket analysis
            technicalNotes: analysis.technicalNotes,
            dataRequirements: analysis.dataRequirements,
            businessRules: analysis.businessRules
        });
    });

    return testCases;
}

// Fallback for tickets without clear structure - now enhanced with component and pattern detection
function generateFallbackTestCase(ticket: JiraTicket, components: string[], patterns: string[]): TestCase[] {
    const contentParser = new ContentAwareParser();
    const userRole = contentParser.mapToApplicationRole(extractRoleFromSummary(ticket.summary) || 'user');

    // Create a mock scenario for label generation
    const mockScenario: TestScenario = {
        title: `Verify ${ticket.summary}`,
        userRole: userRole,
        type: ticket.issueType === 'Bug' ? 'regression' : 'functional',
        preconditions: [`User is logged in as ${userRole}`, 'System is available and functioning'],
        steps: [],
        acceptanceCriteria: ['Functionality works as described in ticket']
    };

    return [{
        id: `${ticket.key}-TC-001`,
        title: `Verify ${ticket.summary}`,
        description: `Test case generated from ${ticket.issueType} ${ticket.key}`,
        userRole: userRole,
        testType: ticket.issueType === 'Bug' ? 'regression' : 'functional',
        userStory: { userRole, goal: 'complete the requirement', benefit: 'system works as expected' },
        preconditions: [`User is logged in as ${userRole}`, 'System is available and functioning'],
        steps: contentParser.generateRoleAwareSteps(
            'complete the requirement',
            userRole,
            ['Functionality works as described in ticket'],
            components,
            patterns
        ),
        acceptanceCriteria: ['Functionality works as described in ticket'],
        expectedResult: 'All requirements from the ticket are fulfilled',
        priority: ticket.priority,
        linkedTicket: ticket.key,
        status: 'pending',
        assignee: ticket.assignee,
        components: components.length > 0 ? components : ticket.components,
        technicalNotes: [],
        dataRequirements: [],
        businessRules: []
    }];
}

// Helper function to extract role from ticket summary
function extractRoleFromSummary(summary: string): string | null {
    // Application-specific role patterns
    const rolePatterns = [
        /\b(prepress|admin|administrator|backend|operator|staff)\b/i,
        /\b(customer[\s-]?care|support|agent|representative|assistant|service)\b/i,
        /\b(customer|user|end[\s-]?user|client|buyer|visitor)\b/i,
        /\b(manager|supervisor|senior|lead)\b/i,
        /\b(developer|dev)\b/i,
        /\b(tester|qa)\b/i,
        /\b(analyst|business[\s-]?analyst)\b/i,
        /\b(designer)\b/i
    ];

    for (const pattern of rolePatterns) {
        const match = summary.match(pattern);
        if (match) {
            const role = match[1].toLowerCase().replace(/[\s-]/g, ' ');
            // Map to application-specific roles
            if (role.includes('prepress') || role.includes('admin') || role.includes('administrator') ||
                role.includes('backend') || role.includes('operator') || role.includes('staff') ||
                role.includes('senior') || role.includes('lead') || role.includes('manager')) {
                return 'prepress';
            }
            if (role.includes('customer care') || role.includes('support') || role.includes('agent') ||
                role.includes('representative') || role.includes('assistant') || role.includes('service')) {
                return 'customer-care';
            }
            if (role.includes('customer') || role.includes('user') || role.includes('client') ||
                role.includes('buyer') || role.includes('visitor')) {
                return 'customer';
            }
            return role;
        }
    }

    return null;
}