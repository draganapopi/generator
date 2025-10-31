# Test Case Generation Instructions

**CRITICAL - READ THIS FIRST**: This document provides guidelines for generating test cases that are SPECIFIC to individual Jira tickets. The PRIMARY source for test case generation is ALWAYS the individual ticket content, NOT generic patterns.

## MANDATORY WORKFLOW FOR TEST CASE GENERATION

### 1. TICKET ANALYSIS FIRST (MOST IMPORTANT)
Before doing ANYTHING else, you MUST:

1. **READ THE COMPLETE TICKET DESCRIPTION**
   - Read EVERY word in the ticket description field
   - Extract ALL acceptance criteria listed in THIS ticket
   - Identify the user story format from THIS ticket: "As a [role] I want [goal] So that [benefit]"
   - Note ALL technical requirements mentioned in THIS ticket
   - Extract ALL business rules described in THIS ticket
   - List ALL components mentioned in THIS ticket
   - Identify ALL data requirements from THIS ticket

2. **ANALYZE TICKET-SPECIFIC CONTENT**
   - What SPECIFIC functionality does THIS ticket request?
   - What EXACT acceptance criteria must be validated for THIS ticket?
   - What SPECIFIC user role is mentioned in THIS ticket?
   - What PARTICULAR components are affected by THIS ticket?
   - What PRECISE data requirements are specified in THIS ticket?

3. **GENERATE TICKET-SPECIFIC TEST CASES**
   - Test ONLY what is described in THIS specific ticket
   - Validate ONLY the acceptance criteria from THIS ticket
   - Use ONLY the user role specified in THIS ticket
   - Include ONLY components mentioned in THIS ticket

### 2. APPLICATION CONTEXT (USE ONLY FOR UNDERSTANDING)
The information below is provided ONLY to help you understand the application context. DO NOT use this to create generic test patterns.

## Overview

The test case generation system analyzes Jira ticket content to automatically create structured test cases that cover functional, technical, and edge case scenarios. The system supports both Gherkin-formatted tickets and general requirement descriptions.

**IMPORTANT**: The system must generate test cases that are EXCLUSIVELY based on the specific ticket content being processed, NOT on generic patterns or templates.

## TICKET-SPECIFIC CONTENT ANALYSIS PROCESS

### PRIMARY REQUIREMENT: Read the Individual Ticket

When analyzing ANY ticket, you must extract the following components FROM THAT SPECIFIC TICKET:

#### Step 1: Extract User Story Components FROM THIS TICKET
- **User Role**: Find patterns like "As a [role]", "As an [role]" IN THIS TICKET
- **Goal**: Find patterns like "I want to [goal]", "I want [goal]" IN THIS TICKET  
- **Benefit**: Find patterns like "So that [benefit]", "So I can [benefit]" IN THIS TICKET

#### Step 2: Extract Acceptance Criteria FROM THIS TICKET
Look for sections in THIS TICKET containing:
- "Acceptance Criteria"
- "Requirements" 
- "Data to be provided"
- "Endpoint details"
- "Technical notes"
- "Security requirements"

Extract ALL bullet points from THIS TICKET using patterns:
- Lines starting with "* ", "- ", "• "
- Numbered lists (1., 2., etc.)
- API endpoint definitions
- Functional requirements

#### Step 3: Extract Technical Information FROM THIS TICKET
- **Technical Notes**: Find implementation details, constraints, and technical requirements IN THIS TICKET
- **Data Requirements**: Find required fields, formats, and validation rules IN THIS TICKET
- **Business Rules**: Find conditional logic, validation rules, and business constraints IN THIS TICKET

#### Step 4: Identify Affected Components FROM THIS TICKET
Based on the content of THIS TICKET, determine which components are mentioned or affected:
- Look for explicit mentions of component names
- Identify functionality that relates to specific components
- Map ticket requirements to affected system areas

### CRITICAL RULES:
1. **ONLY test what is explicitly described in the individual ticket**
2. **NEVER add functionality not mentioned in the ticket**
3. **NEVER use generic patterns that could apply to any ticket**
4. **ALWAYS base test cases on the specific acceptance criteria from the ticket**

## Application Context (Use ONLY for Understanding)

### 1. Ticket Content Extraction

When analyzing a ticket, extract the following components:

#### User Story Components
- **User Role**: Extract from patterns like "As a [role]", "As an [role]"
- **Goal**: Extract from patterns like "I want to [goal]", "I want [goal]"  
- **Benefit**: Extract from patterns like "So that [benefit]", "So I can [benefit]"

#### Application-Specific User Roles
The system supports three distinct user roles with specific capabilities:

**Customer**
- Access to web components: Configurator, Category component, Communication History
- Can create products using the Configurator
- Can place orders and manipulate existing orders
- Can navigate from Communication History to Configurator in Edit mode
- Can approve/reject proofs on Order Activity
- Can view order details and activity history

**Customer Care**
- Has all capabilities of Customer role
- Can access and manipulate all customer data and orders
- Can assist customers with order management
- Can view comprehensive order activity and customer interactions

**Prepress**
- Access limited to Backoffice portal only
- Can manipulate products, options, and orders in the backend system
- Can generate proofs for customer approval
- Can update order status and add activity entries
- Can require customers to change configuration(triggering edit mode access)
- Can include customer care into communication
- Can request new artwork from customers (edit mode for customer)
- Can request factory check for an order 
- 

#### Acceptance Criteria
Look for sections containing:
- "Acceptance Criteria"
- "Requirements" 
- "Data to be provided"
- "Endpoint details"
- "Technical notes"
- "Security requirements"

Extract bullet points using patterns:
- Lines starting with "* ", "- ", "• "
- Numbered lists (1., 2., etc.)
- API endpoint definitions
- Functional requirements

#### Technical Information
- **Technical Notes**: Extract implementation details, constraints, and technical requirements
- **Data Requirements**: Extract required fields, formats, and validation rules
- **Business Rules**: Extract conditional logic, validation rules, and business constraints

#### Application Components
The system includes several key components that should be considered when generating test cases:

**Configurator**
- Product configuration interface where users select options
- Allows quantity selection, logo addition, address specification
- Supports shipping option selection
- Enables order creation workflow
- Supports Edit mode for order modifications
- Accessible by Customer and Customer Care roles

**Category Component**
- Product categorization and browsing interface
- Accessible by Customer and Customer Care roles

**Communication History**
- Displays order history and details for customers
- Shows comprehensive order information and status
- Provides navigation to Configurator in Edit mode
- Contains Order Activity section with all actions and communications
- Accessible by Customer and Customer Care roles

**Order Activity**
- Comprehensive overview of all order-related actions
- Shows interactions from Prepress and Customer Care
- Displays proof approval/rejection status
- Contains all order modification history
- Tracks communication and status changes

**Backoffice Portal**
- Administrative interface for Prepress role
- Allows product, option, and order manipulation
- Proof generation functionality
- Order status management
- Restricted to Prepress role only

**Thank You Page**
- Generated after successful order creation
- Displays order confirmation details
- Provides order reference information

### 2. Scenario Generation Strategy (BASED ON SPECIFIC TICKET)

**CRITICAL**: Generate scenarios ONLY based on what is described in the specific ticket being processed.

#### For Tickets with Clear User Story Format
If THIS TICKET has clear user story format (As a... I want... So that...):

1. **Main Happy Path Scenario FOR THIS TICKET**
   - Title: "User can [extracted goal FROM THIS TICKET]"
   - Generate steps based on the user goal FROM THIS TICKET
   - Include ALL acceptance criteria from THIS TICKET as verification points

2. **Data Validation Scenarios FOR THIS TICKET** 
   - Create scenarios for EACH data requirement mentioned in THIS TICKET
   - Test field validation, format requirements mentioned in THIS TICKET
   - Verify data capture and display described in THIS TICKET

3. **Technical Implementation Scenarios FOR THIS TICKET**
   - Test ONLY technical requirements mentioned in THIS TICKET
   - Verify ONLY implementation details from THIS TICKET's technical notes

4. **Error Handling Scenarios FOR THIS TICKET**
   - Test ONLY error cases mentioned in THIS TICKET
   - Verify error messages specified in THIS TICKET

#### For Tickets without Clear Gherkin Format
If THIS TICKET doesn't have clear Gherkin format:

1. **Extract Change Requirements FROM THIS TICKET**
   - Identify action type mentioned in THIS TICKET: remove, add, change, fix, show, hide
   - Extract target of the change FROM THIS TICKET
   - Identify affected locations/components mentioned in THIS TICKET

2. **Generate Location-Based Tests FOR THIS TICKET**
   - Test EACH location specified in THIS TICKET where changes should appear
   - Verify consistency across ALL areas mentioned in THIS TICKET

3. **Create Verification Scenarios FOR THIS TICKET**
   - Test the main change requirement described in THIS TICKET
   - Verify edge cases mentioned in THIS TICKET
   - Test negative scenarios specified in THIS TICKET

**FORBIDDEN**: 
- Creating scenarios not mentioned in the ticket
- Adding generic test patterns
- Testing functionality not described in the ticket

## Test Case Structure

### Required Fields
```javascript
{
  id: "TICKET-KEY-TC-001",
  title: "Descriptive test case title",
  description: "Detailed description of what is being tested",
  userRole: "customer|customer-care|prepress",
  testType: "functional|regression|integration|performance",
  userStory: {
    userRole: "customer|customer-care|prepress",
    goal: "what user wants to achieve", 
    benefit: "why this is valuable"
  },
  preconditions: ["List of setup requirements"],
  steps: [
    {
      step: 1,
      action: "What the user should do",
      expectedResult: "What should happen"
    }
  ],
  acceptanceCriteria: ["List of criteria that must be met"],
  expectedResult: "Overall expected outcome",
  priority: "High|Medium|Low",
  labels: ["functional-test", "configurator", "communication-history", "backoffice", "order-management"],
  linkedTicket: "Original ticket key",
  status: "pending",
  assignee: "From original ticket",
  components: ["Configurator", "Communication History", "Category Component", "Order Activity", "Backoffice Portal", "Thank You Page"]
}
```

## Step Generation Guidelines

### For User Interface Changes
1. **Navigation Steps**: Guide user to the relevant interface
2. **Action Steps**: Perform the required actions
3. **Verification Steps**: Check that changes are visible and correct
4. **Cross-Reference Steps**: Verify consistency across related areas

### For API/Backend Changes  
1. **Setup Steps**: Prepare test data and environment
2. **Request Steps**: Execute API calls or backend operations
3. **Response Validation**: Verify response format and content
4. **Data Persistence**: Check that data is correctly stored/updated

### For Bug Fixes
1. **Reproduction Steps**: Recreate the original problem
2. **Fix Verification**: Confirm the issue is resolved
3. **Regression Testing**: Ensure fix doesn't break existing functionality
4. **Edge Case Testing**: Test boundary conditions

## Content-Specific Patterns

### Product Configuration and Ordering
For tickets involving the Configurator component:
- Test product option selection and configuration
- Verify quantity selection and validation
- Test logo upload and address specification
- Verify shipping option selection
- Test order creation flow and Thank You page generation
- Test Edit mode functionality for order modifications
- Verify cross-component navigation (Communication History ↔ Configurator)

### Order Management and Communication History
For tickets involving order management:
- Test order display and details in Communication History
- Verify Order Activity tracking and visibility
- Test order modification workflows
- Verify Prepress actions and customer notifications
- Test proof approval/rejection functionality
- Verify order status updates and history tracking

### Role-Based Access Control
For tickets involving different user roles:
- Test Customer access to web components (Configurator, Category, Communication History)
- Test Customer Care extended permissions and customer assistance capabilities
- Test Prepress exclusive access to Backoffice portal
- Verify role-based feature restrictions and permissions
- Test cross-role interactions and workflow handoffs

### Backoffice and Administrative Functions
For tickets involving Prepress operations:
- Test product and option management in Backoffice
- Verify proof generation and delivery to customers
- Test order manipulation and status updates
- Verify administrative controls and data management
- Test integration between Backoffice and customer-facing components

### Order Number Formatting
For tickets involving number formatting (e.g., removing leading zeros):
- Test all specified locations where numbers appear
- Verify format consistency across the application
- Test edge cases (numbers with/without leading zeros)
- Verify data integrity and system behavior

### Filter and Search Features
For saved filters or search functionality:
- Test filter creation and saving
- Test filter application and results
- Test filter management (edit, delete, share)
- Test performance with large datasets

### Authentication and Security
For auth-related tickets:
- Test successful authentication flows
- Test various failure scenarios
- Test session management
- Test security constraints and rate limiting

## Fallback Test Case Generation

When ticket content is insufficient for detailed analysis:

1. **Create Generic Functional Test**
   - Title: "Verify [ticket summary]"
   - Basic navigation and verification steps
   - Focus on core functionality described in ticket

2. **Include Standard Verification**
   - System accessibility
   - Basic functionality
   - Error-free operation
   - Requirements fulfillment

## Quality Guidelines

### Test Case Completeness
- Each test case should be independently executable
- Steps should be clear and unambiguous
- Expected results should be specific and measurable
- Preconditions should cover all necessary setup

### Coverage Considerations
- Generate multiple scenarios for complex features
- Include both positive and negative test cases
- Cover different user roles (customer, customer-care, prepress) when applicable
- Test cross-component interactions (Configurator ↔ Communication History)
- Test role-based access restrictions and permissions
- Test order lifecycle from creation to completion
- Test proof approval/rejection workflows
- Test Edit mode functionality and restrictions
- Include edge cases and boundary conditions

### Maintainability
- Use consistent naming conventions
- Link test cases to original tickets
- Include relevant labels for categorization
- Document technical requirements and constraints

## Implementation Notes

- Always log the analysis process for debugging
- Handle tickets with missing or incomplete descriptions gracefully
- Provide meaningful fallback scenarios when parsing fails
- Ensure generated test cases align with project testing standards
- Consider the ticket type (Story, Bug, Task) when generating scenarios
- Account for role-specific capabilities and restrictions when generating test steps
- Include component-specific validation based on the affected system areas
- Consider order lifecycle stages when testing order-related functionality
- Verify cross-component navigation and data consistency
- Test proof generation and approval workflows for Prepress-related tickets

This instruction set ensures comprehensive, consistent, and maintainable test case generation from diverse Jira ticket formats, specifically tailored for the product configuration and order management system with its distinct user roles and component architecture.