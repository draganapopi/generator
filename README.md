# Jira Test Case Generator UI

A modern web application for automatically generating test cases from Jira tickets using Gherkin acceptance criteria parsing.

## 🚀 Features

- **Browse Jira Tickets**: View and filter tickets from your Jira instance
- **Gherkin Parsing**: Automatically parse Given/When/Then scenarios from ticket descriptions
- **Test Case Generation**: Create structured test cases with preconditions, steps, and expected results
- **Edit & Approve**: Interactive editor for reviewing and approving generated test cases
- **Real-time Updates**: Live updates for test case status changes
- **Export Options**: Export test cases in YAML, JSON, or CSV formats

## 🏗️ Architecture

### Frontend (Next.js + React + TypeScript)
- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React hooks for local state
- **Type Safety**: Full TypeScript implementation

### Backend (Express.js + Node.js)
- **API Server**: Express.js REST API on port 3001
- **Gherkin Parser**: Custom parser for acceptance criteria
- **Test Generation**: Intelligent test case creation engine
- **Mock Data**: Development data for testing UI components

## 📁 Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout component
│   │   └── page.tsx         # Main application page
│   ├── components/          # React components
│   │   ├── Header.tsx       # Application header
│   │   ├── TicketList.tsx   # Jira tickets display
│   │   └── TestCaseEditor.tsx # Test case editing interface
│   └── types/
│       └── index.ts         # TypeScript type definitions
├── server/
│   └── index.js            # Express.js API server
├── package.json            # Project dependencies and scripts
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── next.config.js         # Next.js configuration
```

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jira-test-case-generator-ui
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development servers**
   ```bash
   # Start both frontend and backend
   npm run dev:full
   
   # Or start them separately:
   npm run server    # Backend on port 3001
   npm run dev      # Frontend on port 3003 (or next available)
   ```

4. **Open the application**
   - Frontend: http://localhost:3003
   - Backend API: http://localhost:3001/api/health

## 📋 Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run server` - Start Express.js API server
- `npm run dev:full` - Start both frontend and backend concurrently
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔗 API Endpoints

### GET /api/tickets
Retrieve list of Jira tickets
```json
{
  "success": true,
  "tickets": [...],
  "total": 42
}
```

### POST /api/generate-test-cases
Generate test cases for a specific ticket
```json
{
  "ticket": { "key": "MTO-1842", ... }
}
```

### GET /api/health
Health check endpoint
```json
{
  "status": "ok",
  "timestamp": "2024-10-24T12:00:00.000Z",
  "service": "Jira Test Case Generator API"
}
```

## 🎯 Usage Workflow

1. **Browse Tickets**: View available Jira tickets in the left panel
2. **Select Ticket**: Click on a ticket to generate test cases
3. **Review Generated Cases**: Examine auto-generated test cases in the right panel
4. **Edit if Needed**: Use the edit functionality to modify test cases
5. **Approve/Reject**: Mark test cases as approved or rejected
6. **Export**: Download test cases in your preferred format

## 🧩 Gherkin Parsing

The application automatically parses Gherkin-style acceptance criteria from Jira ticket descriptions:

```gherkin
Feature: Saved filters for prepress seniors

Background:
Given I am logged in as a prepress senior
And I have access to the prepress backoffice system

Scenario: Save a new filter
Given I am on the filter configuration page
When I configure search criteria with specific parameters
And I click "Save Filter" button
Then the filter should be saved successfully
And I should see "Filter saved successfully" message
```

This gets converted into structured test cases with:
- **Preconditions**: Background + Given statements
- **Test Steps**: When statements (actions) + Then statements (verifications)
- **Expected Results**: Final Then statement

## 🔧 Configuration

### Next.js Configuration (next.config.js)
- API proxy setup for backend communication
- Build optimization settings

### Tailwind Configuration (tailwind.config.js)
- Custom color scheme for UI components
- Component path scanning

### TypeScript Configuration (tsconfig.json)
- Path aliases for clean imports (@/* → ./src/*)
- Strict type checking enabled

## 🚀 Deployment

### Development
The application is currently set up for development with:
- Hot reload for frontend changes
- Nodemon for backend auto-restart
- Mock data for testing UI components

### Production
For production deployment:
1. Build the frontend: `npm run build`
2. Configure environment variables for Jira API
3. Set up proper CORS policies
4. Use process manager (PM2) for backend

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📝 Future Enhancements

- [ ] Real Jira API integration
- [ ] X-Ray test management integration
- [ ] User authentication and sessions
- [ ] Bulk test case operations
- [ ] Advanced filtering and search
- [ ] Test execution tracking
- [ ] Pipeline integration for automated testing

## 🐛 Troubleshooting

### Port Conflicts
If you encounter port conflicts:
```bash
# Kill processes using ports
taskkill /PID <process-id> /F
# Or use different ports in package.json scripts
```

### Build Errors
Common issues and solutions:
- TypeScript errors: Check imports and type definitions
- CSS not loading: Verify Tailwind configuration
- API connection issues: Ensure backend is running on port 3001

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ using Next.js, React, TypeScript, and Tailwind CSS**