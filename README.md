# story-point-poker

A collaborative real-time story point estimation tool built with Vue 3 and WebSocket technology. This application enables agile development teams to conduct Planning Poker sessions for Jira tickets with live voting, automatic consensus detection, and direct integration with Jira's REST API.

![Vue 3](https://img.shields.io/badge/Vue-3.4-brightgreen?logo=vue.js)
![Node.js](https://img.shields.io/badge/Node.js-16+-green?logo=node.js)
![WebSocket](https://img.shields.io/badge/WebSocket-Native-blue)
![Jira API](https://img.shields.io/badge/Jira-REST%20API%20v3-0052CC?logo=jira)

## Features

### Real-Time Collaboration
- **Multi-user sessions** with WebSocket-based live updates
- **Automatic host assignment** - first user becomes host, seamless transfer on disconnect
- **Real-time user presence** tracking with visual host indicator (crown icon)
- **Instant vote synchronization** across all connected team members
- **Auto-reconnection** handling for seamless user experience

### Jira Integration
- **Direct REST API integration** with Jira Cloud instances
- **Advanced ticket filtering** using JQL (Jira Query Language):
  - Filter by project, sprint status (active/future/backlog)
  - Filter by assignee, status, priority, issue type
  - Configurable result limits
- **Automatic story point updates** directly to Jira custom fields
- **Real-time sync** between estimation results and Jira tickets

### Planning Poker Workflow
- **Sequential ticket voting** - one ticket at a time for focused estimation
- **Hidden vote casting** with visual vote count tracking
- **Host-controlled reveal** with automatic statistics calculation
- **Consensus detection** - automatically suggests most common vote
- **Flexible final results** - host can adjust final story points
- **One-click completion** - automatically updates Jira and moves to next ticket

### User Experience
- **Modern glassmorphism UI** design with responsive layout
- **Host-only controls** for vote reveal, result setting, and completion
- **Real-time activity feed** showing user joins/leaves
- **Standard Planning Poker values**: 0, 1, 2, 3, 5, 8, 13, 21, ?, ∞
- **Visual voting progress** indicators showing participation rate

## Tech Stack

**Frontend:**
- Vue 3 (Composition API)
- Vite (lightning-fast build tool)
- Native WebSocket API

**Backend:**
- Node.js
- WebSocket Server (ws library)
- Axios (Jira REST API client)

**Integration:**
- Jira REST API v3
- Basic Authentication (email + API token)

## Project Structure

```
story-point-poker/
├── client/                    # Vue 3 frontend
│   ├── src/
│   │   ├── components/        # Vue components
│   │   │   ├── Login.vue      # User authentication
│   │   │   ├── UserList.vue   # Connected users sidebar
│   │   │   ├── TicketCard.vue # Current ticket display
│   │   │   ├── VotingPanel.vue# Voting interface
│   │   │   ├── JiraConfig.vue # Jira configuration (host only)
│   │   │   └── ...
│   │   ├── composables/       # Vue composables
│   │   │   └── useWebSocket.js# WebSocket connection management
│   │   ├── App.vue            # Main dashboard component
│   │   ├── main.js            # App entry point
│   │   └── style.css          # Global styles
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── server/                    # Node.js WebSocket server
    ├── server.js              # WebSocket server + Jira integration
    └── package.json
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Yarn or npm
- Jira Cloud account with API access

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:Cheng-Kai-Ming/story-point-poker.git
   cd story-point-poker
   ```

2. **Install server dependencies**
   ```bash
   cd server
   yarn install
   # or: npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   yarn install
   # or: npm install
   ```

### Running the Application

#### Development Mode

1. **Start the WebSocket server** (Terminal 1)
   ```bash
   cd server
   yarn start
   ```
   Server runs on `ws://localhost:8080`

2. **Start the Vue development server** (Terminal 2)
   ```bash
   cd client
   yarn dev
   ```
   Client runs on `http://localhost:3000`

3. **Open your browser** and navigate to `http://localhost:3000`

#### Quick Start (One-Line Setup)
```bash
# Install all dependencies
cd server && yarn install && cd ../client && yarn install && cd ..
```

### Production Build

Build the Vue app for production:
```bash
cd client
yarn build
```

Built files will be in `client/dist/`. Preview the build:
```bash
yarn preview
```

## Usage Guide

### Initial Setup

1. **First User (Host)**
   - Enter your name and join the session
   - You automatically become the host (crown icon)
   - Configure Jira integration in the settings panel

2. **Jira Configuration** (Host only)
   - **Domain**: Your Jira domain (e.g., `yourcompany.atlassian.net`)
   - **Email**: Your Jira account email
   - **API Token**: Generate from [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
   - **Project Key**: Your Jira project key (e.g., `PROJ`)
   - **Story Points Field**: Custom field ID (default: `customfield_10016`)

3. **Fetch Tickets**
   - Apply filters (sprint, assignee, status, etc.)
   - Click "Fetch Tickets" to load from Jira
   - Tickets appear for all team members

### Planning Poker Session

1. **Team Members Join**
   - Share the URL with team members
   - Each person enters their name to join
   - All members see the same current ticket

2. **Vote on Story Points**
   - Review the ticket details (title, description, priority)
   - Each member selects their estimate (0, 1, 2, 3, 5, 8, 13, 21, ?, ∞)
   - Vote count updates in real-time (votes remain hidden)

3. **Host Reveals Votes**
   - When ready, host clicks "Reveal Votes"
   - All votes become visible with user attribution
   - Statistics show most common vote and suggested result

4. **Set Final Result** (Host only)
   - Host reviews team votes
   - Adjusts final story points if needed
   - Click "Complete & Next" to:
     - Update story points in Jira
     - Move to next ticket
     - Reset voting for new round

### Advanced Features

**Ticket Navigation** (Host only)
- Jump to any ticket in the list
- Track progress with "X of Y tickets" indicator

**User Management**
- Automatic host transfer if host disconnects
- Real-time user list updates
- Visual indicators for vote participation

**Error Handling**
- Connection status indicators
- Jira API error messages
- Automatic reconnection attempts

## Configuration

### WebSocket Server

Modify `server/server.js` to customize:
- Port number (default: 8080)
- Ticket data structure
- Voting rules

### Client Configuration

Update `client/src/App.vue`:
```javascript
const WS_URL = 'ws://localhost:8080' // Change for production
```

### Jira Custom Field

Find your story points field ID:
1. Go to Jira Settings → Issues → Custom Fields
2. Click "..." on Story Points field → View
3. Note the field ID in the URL (e.g., `customfield_10016`)

## Troubleshooting

### Jira Connection Issues

**401 Unauthorized**
- Verify email and API token are correct
- Ensure API token has not expired
- Check Jira account permissions

**Field Update Errors**
- Verify story points field ID is correct
- Ensure field is editable for the issue type
- Check project permissions

### WebSocket Connection

**Cannot connect to server**
- Ensure server is running on port 8080
- Check firewall settings
- Verify WebSocket URL in client config

**Frequent disconnections**
- Check network stability
- Review browser console for errors
- Ensure server hasn't crashed

## Development

### Adding New Vote Values

Modify the voting options in `client/src/components/VotingPanel.vue`:
```javascript
const voteOptions = ['0', '1', '2', '3', '5', '8', '13', '21', '?', '∞']
```

### Customizing Ticket Filters

Add new filters in `server/server.js` `fetchJiraTickets()` function:
```javascript
if (filters.customField) {
  jqlParts.push(`customField = "${filters.customField}"`)
}
```

### Styling

Global styles: `client/src/style.css`
Component styles: Scoped `<style>` sections in Vue components

## API Reference

### WebSocket Messages

**Client → Server:**
```javascript
// Join session
{ type: 'join', username: 'John Doe' }

// Cast vote
{ type: 'cast-vote', points: '5' }

// Reveal votes (host only)
{ type: 'reveal-votes' }

// Set final result (host only)
{ type: 'set-final-result', result: 5 }

// Complete voting (host only)
{ type: 'complete-voting' }

// Configure Jira (host only)
{ type: 'set-jira-config', config: {...} }

// Fetch tickets (host only)
{ type: 'fetch-jira-tickets', filters: {...} }
```

**Server → Client:**
```javascript
// User list update
{ type: 'users', users: [...] }

// Current ticket
{ type: 'currentTicket', ticket: {...}, ticketIndex: 0, totalTickets: 10 }

// Voting state
{ type: 'votingState', voteCount: 3, totalUsers: 5, revealed: false }

// Votes revealed
{ type: 'votesRevealed', votes: [...], statistics: {...} }
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - feel free to use this project for your team's planning sessions!

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: [Your contact information]

## Acknowledgments

- Built with Vue 3 and WebSocket for real-time collaboration
- Inspired by Planning Poker methodology
- Jira integration via Atlassian REST API v3

---

**Made with ❤️ for agile teams**
