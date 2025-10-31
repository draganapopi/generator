# Jira Test Case Generator UI

A modern fullstack web application for automatically generating test cases from Jira tickets using Gherkin acceptance criteria parsing.

## 🚀 Features

- **Browse Jira Tickets**: View and filter tickets from your Jira instance
- **Gherkin Parsing**: Automatically parse Given/When/Then scenarios from ticket descriptions
- **Test Case Generation**: Create structured test cases with preconditions, steps, and expected results
- **Edit & Approve**: Interactive editor for reviewing and approving generated test cases
- **Real-time Updates**: Live updates for test case status changes
- **Export Options**: Export test cases in YAML, JSON, or CSV formats

## 🏗️ Architecture

### Fullstack Next.js Application
- **Framework**: Next.js 15 with App Router (Frontend + Backend)
- **Frontend**: React + TypeScript with Tailwind CSS
- **Backend**: Next.js API Routes (replacing Express.js)
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React hooks for local state
- **Type Safety**: Full TypeScript implementation throughout

## 📁 Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/            # API Routes (Backend)
│   │   │   ├── generate-test-cases/  # Test case generation endpoint
│   │   │   ├── jira/       # Jira integration endpoints
│   │   │   ├── tickets/    # Tickets management
│   │   │   ├── health/     # Health check
│   │   │   └── debug-ticket/ # Debugging endpoint
│   │   ├── globals.css     # Global styles
│   │   ├── layout.tsx      # Root layout component
│   │   └── page.tsx        # Main application page
│   ├── components/         # React components
│   │   ├── Header.tsx      # Application header
│   │   ├── TicketList.tsx  # Jira tickets display
│   │   └── TestCaseEditor.tsx # Test case editing interface
│   ├── lib/                # Backend logic
│   │   ├── jira-client.ts  # Jira API client
│   │   ├── jira-config.ts  # Jira configuration
│   │   └── test-case-generator.ts # Test case generation logic
│   └── types/
│       └── index.ts        # TypeScript type definitions
├── package.json           # Project dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json         # TypeScript configuration
└── next.config.js        # Next.js configuration
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

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open the application**
   - Application: http://localhost:3003
   - API Health Check: http://localhost:3003/api/health

## 📋 Available Scripts

- `npm run dev` - Start Next.js development server (Frontend + Backend)
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔗 API Endpoints

### GET /api/health
Health check endpoint
```json
{
  "status": "ok",
  "timestamp": "2024-10-24T12:00:00.000Z",
  "service": "Jira Test Case Generator API (Next.js)"
}
```

### GET /api/tickets
Retrieve list of Jira tickets
```json
{
  "success": true,
  "tickets": [...],
  "total": 42,
  "source": "jira|mock"
}
```

### POST /api/show-test-cases
Generate test cases for a specific ticket
```json
{
  "ticket": { "key": "MTO-1842", ... }
}
```

### Jira Integration Endpoints
- `GET /api/jira/test-connection` - Test Jira connection
- `GET /api/jira/boards` - Get available boards
- `GET /api/jira/boards/{boardId}/tickets` - Get board tickets
- `GET /api/jira/boards/{boardId}/sprints` - Get board sprints
- `GET /api/jira/boards/{boardId}/sprints/{sprintId}/tickets` - Get sprint tickets
- `POST /api/jira/search` - Search tickets with JQL


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

### Environment Variables (Optional)
For Jira integration, set these environment variables:
```bash
JIRA_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_TOKEN=your-jira-api-token
JIRA_BOARD_ID=your-default-board-id
```

If not configured, the application will use mock data for development.

### Next.js Configuration (next.config.js)
- Build optimization settings
- TypeScript configuration

### Tailwind Configuration (tailwind.config.js)
- Custom color scheme for UI components
- Component path scanning

### TypeScript Configuration (tsconfig.json)
- Path aliases for clean imports (@/* → ./src/*)
- Strict type checking enabled

## 🚀 Deployment

### Development
The application runs as a single Next.js server with:
- Hot reload for frontend changes
- API routes for backend functionality
- Mock data when Jira is not configured

### Production
For production deployment:
1. Build the application: `npm run build`
2. Configure environment variables for Jira API (optional)
3. Start production server: `npm run start`
4. Application runs on port 3003

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📝 Future Enhancements

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
# Kill processes using ports (Windows)
taskkill /PID <process-id> /F
# Or change port in package.json
```

### Build Errors
Common issues and solutions:
- TypeScript errors: Check imports and type definitions
- CSS not loading: Verify Tailwind configuration
- Module not found: Check path aliases in tsconfig.json

### Jira Connection Issues
- Verify environment variables are set correctly
- Check network connectivity to Jira instance
- Validate API token permissions
- Application works with mock data when Jira is not configured

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ using Next.js, React, TypeScript, and Tailwind CSS**