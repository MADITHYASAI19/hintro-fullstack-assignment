# Real-Time Task Collaboration Platform

Kanban-style project management tool with real-time collaboration. Built with React, Node.js, Express, MongoDB, and Socket.io.

## Tech Stack

|Layer|Technology|
|---|---|
|Frontend|React, Vite, Tailwind CSS|
|Backend|Node.js, Express|
|Database|MongoDB, Mongoose|
|Auth|JWT, bcrypt|
|Realtime|Socket.io|
|Testing|Jest, Supertest, Vitest|

## Features

- User registration and login (JWT auth)
- Create and manage boards
- Create lists inside boards
- Create, update, delete tasks
- Drag and drop tasks across lists (react-beautiful-dnd)
- Assign users to tasks
- Real-time sync across multiple tabs/users (Socket.io)
- Activity history tracking per board
- Search tasks by title or description
- Paginated boards, tasks, and activity logs
- Board view (Kanban) and List view toggle

## Project Structure

```text
project/
├── backend/
│   ├── controllers/        # Route handlers
│   ├── middleware/          # JWT auth middleware
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express routes
│   ├── tests/              # Jest test suite
│   ├── seed.js             # Database seeder
│   └── server.js           # Entry point + socket setup
├── frontend/
│   ├── src/
│   │   ├── components/     # List, Task, ActivitySidebar
│   │   ├── context/        # Socket context
│   │   ├── pages/          # Login, Signup, Dashboard, BoardPage
│   │   ├── utils/          # Axios API client
│   │   ├── App.jsx         # Router + nav
│   │   └── index.css       # Global styles
│   └── tailwind.config.js
└── docker-compose.yml
```

## Setup

### Prerequisites

- Node.js 18+
- MongoDB running locally (or use standalone mode with in-memory DB)

### Backend

```bash
cd project/backend
npm install
```

Create `.env` file:

```bash
MONGO_URI=mongodb://127.0.0.1:27017/taskapp
JWT_SECRET=your_jwt_secret
PORT=5000
```

Run with MongoDB:

```bash
npm run dev
```

Run standalone (in-memory, no MongoDB needed):

```bash
npm run standalone
```

### Frontend

```bash
cd project/frontend
npm install
npm run dev
```

Open <http://localhost:5173>

### Demo Credentials (standalone mode)

|Email|Password|
|---|---|
|<admin@gmail.com>|password|
|<user1@gmail.com>|password|
|<user2@gmail.com>|password|

## API Endpoints

### Auth

|Method|Endpoint|Description|Auth|
|---|---|---|---|
|POST|/api/auth/register|Register user|No|
|POST|/api/auth/login|Login user|No|
|GET|/api/auth/user|Get current user|Yes|

### Boards

|Method|Endpoint|Description|Auth|
|---|---|---|---|
|GET|/api/boards|List boards (paginated)|Yes|
|POST|/api/boards|Create board|Yes|
|GET|/api/boards/:id|Get board with lists|Yes|
|GET|/api/boards/:id/tasks|Board tasks (paginated)|Yes|
|GET|/api/boards/:id/activity|Activity log (paginated)|Yes|

### Lists

|Method|Endpoint|Description|Auth|
|---|---|---|---|
|POST|/api/lists|Create list|Yes|

### Tasks

|Method|Endpoint|Description|Auth|
|---|---|---|---|
|GET|/api/tasks|List tasks (paginated)|Yes|
|POST|/api/tasks|Create task|Yes|
|PUT|/api/tasks/:id|Update/move task|Yes|
|DELETE|/api/tasks/:id|Delete task|Yes|
|GET|/api/tasks/search|Search tasks (paginated)|Yes|

## Real-Time Strategy

Socket.io rooms scoped by `boardId`. When a user opens a board, the client joins that room. Server broadcasts events to all users in the room:

- `task_created` — new task added
- `task_updated` — task edited or moved between lists
- `task_deleted` — task removed
- `list_created` — new list added
- `activity_created` — new activity log entry

Frontend listens for these events and updates state without page refresh.

## Database Indexes

|Collection|Index|Purpose|
|---|---|---|
|Task|`{ title: 'text', description: 'text' }`|Full-text search|
|Task|`{ board: 1 }`|Filter tasks by board|
|Task|`{ assignedTo: 1 }`|Filter by assignment|
|Task|`{ list: 1, position: 1 }`|Sort tasks within a list|
|Activity|`{ board: 1, timestamp: -1 }`|Activity log queries|

## Scalability Considerations

- **Pagination**: All list endpoints return paginated results to avoid loading entire datasets
- **Database indexing**: Compound and text indexes on frequently queried fields
- **Stateless auth**: JWT tokens allow horizontal scaling without session storage
- **Room-based broadcasting**: Socket events scoped to boards, not global
- **Deployment-ready**: Docker Compose config included for containerized deployment

## Assumptions

- Single board owner model (no role-based access control)
- In-memory DB mode provided for easy local evaluation
- Task positions tracked numerically for drag-and-drop ordering
- Activity log is append-only, no editing or deletion

## Trade-offs

- **No file uploads** — kept scope focused on task management
- **No WebSocket authentication** — socket connections are open once the page loads; for production, token-based socket auth would be added
- **Optimistic UI for drag-and-drop** — rolls back on server error, but brief flicker possible on failure

## Running Tests

```bash
# Backend (9 tests)
cd project/backend
npm test

# Frontend (5 tests)
cd project/frontend
npm test
```
