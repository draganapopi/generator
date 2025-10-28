# Jira Test Case Generator UI

This project is a web application for managing Jira test case generation with the following features:

## Project Overview
- **Frontend**: React application for browsing Jira tickets and managing test cases
- **Backend**: Express.js API for Jira integration and test case workflow
- **Features**: 
  - Browse and filter Jira tickets
  - Generate test cases from ticket descriptions (Gherkin parsing)
  - Edit and approve/reject generated test cases
  - Integration with X-Ray for test management

## Architecture
- React frontend with TypeScript
- Express.js backend API
- REST endpoints for Jira communication
- Real-time updates for test case status
- Approval workflow management

## Development Guidelines
- Use TypeScript for type safety
- Follow React best practices
- Implement proper error handling
- Include comprehensive testing
- Use modern CSS/styling approaches

## Current Implementation
The application features:
- Modern Next.js 15 with App Router
- Tailwind CSS for responsive design
- Gherkin parser for automatic test case generation
- Interactive test case editor with approval workflow
- Mock Jira data for development and testing
- Full TypeScript implementation throughout

## Development Workflow
- Frontend runs on http://localhost:3003
- Backend API runs on http://localhost:3001
- Use `npm run dev:full` to start both servers
- Application supports real-time test case generation and editing