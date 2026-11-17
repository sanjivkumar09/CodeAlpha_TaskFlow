# TaskFlow — Modern Full-Stack Project Management Platform

[![CodeAlpha Internship](https://img.shields.io/badge/CodeAlpha-Task%203-8b5cf6?style=for-the-badge)](https://codealpha.tech)
[![Stack](https://img.shields.io/badge/Stack-MERN%20%2B%20Socket.IO%20%2B%20Tailwind-3b82f6?style=for-the-badge)](#technology-stack)
[![License](https://img.shields.io/badge/License-MIT-10b981?style=for-the-badge)](LICENSE)

> A production-grade, collaborative project management SaaS inspired by **Linear**, **Asana**, and **ClickUp**. Built with **React 18, Vite, Tailwind CSS, Node.js, Express, MongoDB (Mongoose), and Socket.IO** for real-time team synchronization.

---

## 📑 Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Architecture & Design System](#architecture--design-system)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Demo Credentials](#demo-credentials)
- [Getting Started & Installation](#getting-started--installation)
- [Environment Configuration](#environment-configuration)
- [Database Configuration](#database-configuration)
- [REST API Documentation](#rest-api-documentation)
- [Real-Time WebSocket Events](#real-time-websocket-events)
- [Testing & Verification](#testing--verification)
- [Production Deployment](#production-deployment)
- [License & Acknowledgements](#license--acknowledgements)

---

## 🚀 Project Overview

**TaskFlow** was engineered to satisfy all requirements of **CodeAlpha Full-Stack Development Internship Task 3**. It is a **genuinely functional web application** with an end-to-end backend, authenticated REST APIs, relational MongoDB schemas, real-time collaboration via WebSockets, and a modern, high-contrast dark SaaS interface.

### Highlights
- **Real-Time Kanban Board**: Drag-and-drop task triage across columns (`To Do`, `In Progress`, `In Review`, `Done`) with position reordering persisted directly to MongoDB and broadcasted live to all workspace members.
- **Project Workspaces**: Multi-project management with real-time completion percentages, milestones, deadlines, and member roles.
- **Collaborative Tasks**: Detailed drawers featuring activity logs, file taggings, editable priorities, due date warnings, and threaded comments.
- **Interactive Calendar View**: Month-by-month scheduling grid showing scheduled task deadlines, upcoming deliverables, and overdue tasks.
- **Executive Analytics Dashboard**: Live metrics, project velocity bar charts, and status/priority distribution charts powered by Recharts.
- **Instant Testing Support**: Out-of-the-box embedded database fallback via `mongodb-memory-server`—no pre-installed MongoDB daemon required for immediate evaluation.

---

## 🌟 Key Features

### 1. Authentication & Security
- Secure registration and login with **bcryptjs password hashing** (salt rounds: 10).
- Stateless **JSON Web Token (JWT)** authentication with Authorization Bearer verification.
- Protected React Router v6 client routes with automatic session restoration and token expiry management.
- Role-based permissions (**Admin / Project Owner** vs **Team Member**) enforced strictly on the backend.

### 2. Executive Analytics Dashboard
- Live database-calculated metrics:
  - Total Projects & Active Projects
  - Completed vs Pending Tasks
  - Overdue Tasks with action alerts
  - Tasks Assigned to current user
- Recharts data visualizations:
  - **Project Progress Velocity**: Dual-bar comparison of total vs completed tasks.
  - **Status Breakdown**: Interactive donut chart.
- Upcoming deadlines feed and recent activity audit stream.

### 3. Drag-and-Drop Kanban Board
- Columns: `To Do` ➔ `In Progress` ➔ `In Review` ➔ `Done`.
- Drag and drop task cards between columns or reorder within columns using `@hello-pangea/dnd`.
- Instant optimistic UI update paired with background MongoDB positional updates.
- Real-time broadcast: any collaborator moving a card updates all peer screens without page refresh.
- Filtering by assignee, priority (`Urgent`, `High`, `Medium`, `Low`), and instantaneous text search.
- Overdue deadline badges with visual red urgency alerts.

### 4. Collaborative Task Details & Comments
- Slide-over inspection drawer for deep work.
- Live comment feed displaying author avatars, roles, timestamps, and formatted messages.
- Real-time comment push notifications to assignees and project owners.
- Inline task title and description editor.
- Assignee and priority hot-swapping.

### 5. Team & Workspace Collaboration
- Project member directory with role indicators.
- Instant direct add for existing users or shareable token invitation links.
- Member removal and role promotion/demotion permissions.
- Autocomplete user search for task assignment.

### 6. Interactive Monthly Calendar
- Full grid calendar rendering task chips on their due dates.
- Previous / Next month navigation with 1-click "Today" reset.
- Sidebar highlighting critical overdue tasks and scheduled deadlines.

### 7. Real-Time Notification Center
- Unread badge counter in top navigation.
- Desktop notifications for task assignments, status shifts, comments, and project invites.
- 1-click "Mark All Read" and single-item dismiss.

---

## 🎨 Architecture & Design System

The visual design follows the aesthetic principles of **Linear**, **Asana**, and **ClickUp**:
- **Palette**: Deep slate/zinc dark mode background (`#090d16` / `#0c1220`) with refined border strokes (`#1e293b`).
- **Typography**: Clean `Inter` font hierarchy with tabular numerical alignments for metrics.
- **Subtle Accents**: Indigo (`#6366f1`), Violet (`#8b5cf6`), Emerald (`#10b981`), Amber (`#f59e0b`), and Coral (`#ef4444`).
- **Transitions**: Smooth 150ms ease transitions on cards, buttons, modals, and drop targets.
- **Responsiveness**: Mobile drawer sidebar, fluid grid layouts, and horizontal touch scrolling for board columns.

---

## 🛠 Technology Stack

### Frontend
- **React.js 18** (Vite build tool)
- **Tailwind CSS 3** (Custom SaaS theme tokens)
- **React Router v6** (Nested layouts & protected route guards)
- **Axios** (Configured interceptors with Bearer token injection)
- **Lucide React** (Crisp vector iconography)
- **Recharts 2** (Interactive analytics charts)
- **@hello-pangea/dnd** (Accessible drag-and-drop Kanban engine)
- **Socket.IO Client** (Real-time bidirectional event subscriptions)

### Backend
- **Node.js 20+**
- **Express.js 4** (RESTful API controllers & routing)
- **MongoDB & Mongoose 8** (Schema validation, indexes, pre-save hooks)
- **Socket.IO 4** (Project rooms & direct user notification channels)
- **JSON Web Tokens (jsonwebtoken)**
- **Bcrypt.js** (Password encryption)
- **Morgan** & **CORS**

### Embedded Standalone Engine
- **mongodb-memory-server**: Embedded zero-config MongoDB instance that fires automatically if no local/remote MongoDB service is running, ensuring the evaluator can run and grade the project immediately.

---

## 📁 Project Structure

```text
TaskFlow/
├── client/                     # Frontend React (Vite) Application
│   ├── public/                 # Static assets & favicons
│   ├── src/
│   │   ├── assets/             # Icons and media
│   │   ├── components/         # Reusable UI components
│   │   │   ├── GlobalSearchModal.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── QuickCreateModal.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── TaskDetailModal.jsx
│   │   ├── context/            # React Context state providers
│   │   │   ├── AuthContext.jsx
│   │   │   ├── ProjectContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── layouts/            # MainLayout (Sidebar + Navbar + Outlets)
│   │   │   └── MainLayout.jsx
│   │   ├── pages/              # Application views
│   │   │   ├── CalendarView.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── KanbanBoard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── MyTasks.jsx
│   │   │   ├── Notifications.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Settings.jsx
│   │   │   └── Team.jsx
│   │   ├── services/           # Axios API service endpoints
│   │   │   └── api.js
│   │   ├── App.jsx             # Route definitions
│   │   ├── index.css           # Tailwind directives & custom scrollbars
│   │   └── main.jsx            # React root mount
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
│
├── server/                     # Backend Node.js / Express API
│   ├── config/
│   │   └── db.js               # MongoDB connection with memory-server fallback
│   ├── controllers/            # Controller business logic
│   │   ├── authController.js
│   │   ├── commentController.js
│   │   ├── dashboardController.js
│   │   ├── notificationController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   ├── teamController.js
│   │   └── userController.js
│   ├── middleware/             # Auth & RBAC access guards
│   │   ├── auth.js
│   │   └── projectAuth.js
│   ├── models/                 # Mongoose schemas
│   │   ├── Comment.js
│   │   ├── Invitation.js
│   │   ├── Notification.js
│   │   ├── Project.js
│   │   ├── Task.js
│   │   └── User.js
│   ├── routes/                 # Express API routes
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── notificationRoutes.js
│   │   ├── projectRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── teamRoutes.js
│   │   └── userRoutes.js
│   ├── seed/                   # Database seed script
│   │   └── seed.js
│   ├── sockets/                # Socket.IO connection & event handlers
│   │   └── socketHandler.js
│   ├── tests/                  # Backend automated self-checks
│   │   └── self-check.js
│   ├── utils/
│   │   └── jwt.js
│   ├── package.json
│   ├── server.js               # Server entry point
│   ├── .env.example
│   └── .env
│
├── .gitignore
├── .env.example
├── package.json                # Root orchestration package
└── README.md
```

---

## 🔑 Demo Credentials

For quick evaluation, the database seed script provisions 5 realistic team members across various roles with pre-hashed credentials:

| Name | Role | Email | Password |
| :--- | :--- | :--- | :--- |
| **Alex Rivera** | Lead Architect (Admin) | `alex@taskflow.dev` | `password123` |
| **Sarah Chen** | Senior Frontend Engineer | `sarah@taskflow.dev` | `password123` |
| **Marcus Johnson** | Senior Backend Engineer | `marcus@taskflow.dev` | `password123` |
| **Elena Rostova** | Principal Product Designer | `elena@taskflow.dev` | `password123` |
| **David Kim** | DevOps & QA Lead | `david@taskflow.dev` | `password123` |

> 💡 **Tip**: On the Login screen, click any of the **1-Click Demo Logins** to authenticate immediately without manual typing!

---

## ⚡ Getting Started & Installation

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- Optional: **MongoDB** running locally or a **MongoDB Atlas URI** (if omitted, TaskFlow automatically uses embedded in-memory MongoDB).

### 1. Clone & Install Dependencies

Clone the repository and install all packages:

```bash
# Clone the repository
git clone https://github.com/your-username/TaskFlow.git
cd TaskFlow

# Option A: Install both client & server dependencies from root
npm run install:all

# Option B: Or install individually
cd server && npm install
cd ../client && npm install
```

### 2. Configure Environment Variables

Create `.env` inside `server/` (or copy from `.env.example`):

```bash
cp server/.env.example server/.env
```

Default values in `server/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/taskflow
JWT_SECRET=taskflow_ultra_secure_jwt_secret_key_2026_codealpha
JWT_EXPIRES_IN=30d
CLIENT_URL=http://localhost:5173
```

### 3. Seed Database with Realistic Data

Populate the database with 5 users, 3 projects, 18 tasks across all columns, comments, and notifications:

```bash
# From root
npm run seed

# Or from server directory
cd server && npm run seed
```

### 4. Run the Application

You can start backend and frontend concurrently:

```bash
# Terminal 1: Backend Server (Port 5000)
cd server
npm run dev

# Terminal 2: Frontend Client (Port 5173)
cd client
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 🔌 REST API Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account | Public |
| `POST` | `/api/auth/login` | Authenticate user & return JWT | Public |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Bearer JWT |
| `GET` | `/api/auth/demo-accounts`| Return list of pre-seeded accounts | Public |

### Projects (`/api/projects`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/projects` | List all user projects with completion stats | Bearer JWT |
| `POST` | `/api/projects` | Create a new project workspace | Bearer JWT |
| `GET` | `/api/projects/:id` | Get single project details and members | Bearer JWT |
| `PUT` | `/api/projects/:id` | Update project information | Owner / Admin |
| `DELETE` | `/api/projects/:id` | Delete project and cascade tasks | Owner Only |
| `GET` | `/api/projects/:id/members` | Get project member list | Bearer JWT |
| `POST` | `/api/projects/:id/invitations` | Invite or add member to project | Owner / Admin |
| `DELETE`| `/api/projects/:id/members/:userId` | Remove member from project | Owner / Admin |
| `PUT` | `/api/projects/:id/members/:userId/role` | Update member role (`admin` / `member`) | Owner Only |

### Tasks (`/api/tasks`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/tasks` | Get tasks with query filters (`project`, `status`, `priority`, `search`, `assignedTo`) | Bearer JWT |
| `POST` | `/api/tasks` | Create task, notify assignee, emit socket | Bearer JWT |
| `GET` | `/api/tasks/:id` | Get single task details | Bearer JWT |
| `PUT` | `/api/tasks/:id` | Update task details & status | Bearer JWT |
| `PUT` | `/api/tasks/:id/reorder` | Drag-and-drop Kanban move & reorder | Bearer JWT |
| `DELETE`| `/api/tasks/:id` | Delete task & associated comments | Bearer JWT |
| `GET` | `/api/tasks/:id/comments` | Get threaded comments for task | Bearer JWT |
| `POST` | `/api/tasks/:id/comments` | Add comment & notify collaborators | Bearer JWT |

### Dashboard & Analytics (`/api/dashboard`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dashboard/stats` | Executive metrics, charts, deadlines & activity | Bearer JWT |

### Notifications & Users (`/api/notifications`, `/api/users`)
| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Get user notifications & unread count | Bearer JWT |
| `PUT` | `/api/notifications/:id/read` | Mark single notification as read | Bearer JWT |
| `PUT` | `/api/notifications/read-all` | Mark all notifications as read | Bearer JWT |
| `GET` | `/api/users/profile` | Get user profile details | Bearer JWT |
| `PUT` | `/api/users/profile` | Update profile (name, bio, avatar, prefs)| Bearer JWT |
| `PUT` | `/api/users/change-password` | Verify current & set new password | Bearer JWT |
| `GET` | `/api/team/users/search?q=` | Search registered users by query | Bearer JWT |

---

## 📡 Real-Time WebSocket Events

TaskFlow uses **Socket.IO** with JWT handshake authentication to manage live updates:

- **Rooms**:
  - `project:{projectId}`: Scope for task creation, deletion, reordering, and comments.
  - `user:{userId}`: Personal room for real-time notification pushes.
- **Client Emits**:
  - `project:join`: Join real-time room for active workspace.
  - `project:leave`: Leave project room upon navigation.
- **Server Broadcasts**:
  - `task:created`: Fired when any team member creates a task.
  - `task:moved`: Fired during drag-and-drop to sync column position across browsers.
  - `task:updated`: Fired when priority, title, assignee or deadline changes.
  - `task:deleted`: Fired when a task is removed.
  - `comment:added`: Live comment appended to task drawer.
  - `notification:new`: Immediate notification badge ping.

---

## 🧪 Testing & Verification

TaskFlow includes an automated backend verification suite (`tests/self-check.js`) that runs assertions against real database records:

```bash
cd server
npm run test:check
```

### Verification Checklist:
- [x] Embedded in-memory MongoDB boots cleanly if no local daemon is present.
- [x] Database seeder creates 5 users, 3 projects, 18 tasks across 4 columns, comments, and notifications.
- [x] Bcrypt password hashing and `matchPassword` verified.
- [x] JWT token signing and decoding verified.
- [x] Kanban column distribution verified (`To Do`, `In Progress`, `In Review`, `Done`).
- [x] Frontend builds cleanly with zero errors (`npm run build`).

---

## 🌐 Production Deployment

### Backend (Railway / Render / Heroku / AWS)
1. Set environment variables (`NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`).
2. Build command: `npm install`
3. Start command: `npm start`

### Frontend (Vercel / Netlify)
1. Build command: `npm run build`
2. Output directory: `dist`
3. Set environment variable `VITE_API_URL` to production backend API URL.

---

## 📜 License

Developed as part of the **CodeAlpha Full Stack Development Internship (Task 3)**.
Released under the [MIT License](LICENSE).
