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

## Database Schema

The application uses **MongoDB** with Mongoose. The schema is relational via `ObjectId` references.

### 1. User

```json
{
  "_id": "ObjectId",
  "username": "String (Unique)",
  "email": "String (Unique)",
  "password": "String (Hashed)",
  "createdAt": "Date"
}
```

### 2. Board

```json
{
  "_id": "ObjectId",
  "title": "String",
  "user": "ObjectId (Ref: User)",
  "createdAt": "Date"
}
```

### 3. List

```json
{
  "_id": "ObjectId",
  "title": "String",
  "board": "ObjectId (Ref: Board)",
  "position": "Number",
  "createdAt": "Date"
}
```

### 4. Task

```json
{
  "_id": "ObjectId",
  "title": "String",
  "description": "String",
  "board": "ObjectId (Ref: Board)",
  "list": "ObjectId (Ref: List)",
  "assignedTo": ["ObjectId (Ref: User)"],
  "position": "Number",
  "deadline": "Date",
  "createdAt": "Date"
}
```

### 5. Activity

```json
{
  "_id": "ObjectId",
  "board": "ObjectId (Ref: Board)",
  "user": "String (Username snapshot)",
  "action": "String (Enum: created, updated, deleted, moved)",
  "details": "String",
  "timestamp": "Date"
}
```

### Indexes

|Collection|Index|Purpose|
|---|---|---|
|Task|`{ title: 'text', description: 'text' }`|Full-text search|
|Task|`{ board: 1 }`|Filter tasks by board|
|Task|`{ assignedTo: 1 }`|Filter by assignment|
|Task|`{ list: 1, position: 1 }`|Sort tasks within a list|
|Activity|`{ board: 1, timestamp: -1 }`|Activity log queries|

## Real-Time Strategy

The system uses **Socket.io** with a **Room-based Architecture** for efficient scaling.

### Workflow

1. **Connection**: Client connects to WebSocket server on load.
2. **Join Room**: When opening a board, client emits `join_board` with `boardId`. Server adds socket to `room:boardId`.
3. **Broadcasting**:
    - User A performs an action (e.g., moves a task).
    - API updates the database.
    - Server emits event (e.g., `task_updated`) to `room:boardId`.
    - User B (in the same room) receives event and UI updates instantly.

### Events

- **`task_created`**: New task card appears in the list.
- **`task_updated`**: Updates title, description, or position (drag-and-drop).
- **`task_deleted`**: Task card is removed.
- **`list_created`**: New list column appears.
- **`activity_created`**: Activity log sidebar updates.

### Optimistic UI

Frontend updates state *immediately* on drag-and-drop. If the server request fails, it reverts changes to ensure consistency.

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
