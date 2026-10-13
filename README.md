# Campus Media Engagement System (CMES)

A full-stack MERN web application for managing campus media events, student participation, faculty supervision, and attendance tracking.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 6, Tailwind CSS 3, Recharts 2 |
| Backend | Express 5, Node.js 22 |
| Database | MongoDB 6+, Mongoose 8 |
| Auth | JWT (httpOnly cookies, 24h expiry) |
| Testing | Vitest + @testing-library/react (client), Jest (server) |

## Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- MongoDB 6+ running locally or an Atlas URI

## Quick Start

```bash
# 1. Clone and enter the project
git clone <repo-url>
cd campus-media-engagement-system

# 2. Install all dependencies
npm run install:all

# 3. Configure environment
cp server/.env.example server/.env
# Edit server/.env and fill in:
#   MONGO_URI=mongodb://localhost:27017/cmes
#   JWT_SECRET=your-secret-key-here

# 4. Seed the database with test data
npm run seed

# 5. Start both servers
npm run dev
# Client: http://localhost:5173
# Server: http://localhost:5000
```

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Head Administrator | head@cmes.edu | Head@2024! |
| Faculty (ET Block) | faculty.et@cmes.edu | Faculty@2024! |
| Faculty (MT Block) | faculty.mt@cmes.edu | Faculty@2024! |
| Faculty (FD Block) | faculty.fd@cmes.edu | Faculty@2024! |
| Faculty (Pharmacy) | faculty.pharmacy@cmes.edu | Faculty@2024! |
| Student (ET Block) | ET2024001@student.cmes.edu | Student@2024! |

## API Overview

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | /api/auth/login | Public | Authenticate and receive session cookie |
| GET | /api/auth/me | All | Get current authenticated user |
| POST | /api/auth/logout | All | Clear session cookie |
| GET | /api/users | head | List users with filters |
| POST | /api/users | head | Create new user |
| GET | /api/users/:id | head, self | Get user profile |
| PUT | /api/users/:id | head, self | Update user |
| POST | /api/users/bulk-import | head | Bulk import students from CSV |
| GET | /api/events | All | List events (filtered by role) |
| POST | /api/events | head | Create event |
| GET | /api/events/:id | All | Get event details |
| PUT | /api/events/:id | head | Update event |
| PATCH | /api/events/:id/publish | head | Publish draft event |
| PATCH | /api/events/:id/cancel | head | Cancel event |
| GET | /api/events/:id/qr | faculty, head | Get QR code data URL |
| GET | /api/blocks | All | List blocks |
| POST | /api/blocks | head | Create block |
| GET | /api/participation/:eventId | faculty, head | List participants for event |
| POST | /api/participation/:eventId/rsvp | student | Submit RSVP |
| GET | /api/participation/my | student | Get own participation records |
| GET | /api/attendance/:eventId | faculty, head | List attendance for event |
| POST | /api/attendance/:eventId/manual | faculty, head | Manual check-in |
| POST | /api/attendance/qr-checkin | student | QR token check-in |
| PATCH | /api/attendance/:eventId/finalize | faculty, head | Finalize attendance |
| GET | /api/reports/attendance | faculty, head | Attendance report |
| GET | /api/reports/participation | faculty, head | Participation report |
| GET | /api/reports/export/attendance | faculty, head | Export attendance CSV |
| GET | /api/reports/export/participation | faculty, head | Export participation CSV |
| GET | /api/notifications | All | List own notifications |
| POST | /api/notifications/announce | faculty, head | Send announcement |
| GET | /api/audit-logs | head | List audit log entries |

## Project Structure

```
campus-media-engagement-system/
├── client/                      # Vite + React SPA
│   ├── src/
│   │   ├── api/                 # Axios API modules (one per resource)
│   │   ├── components/
│   │   │   ├── layout/          # AppShell, Sidebar, Navbar, ProtectedRoute
│   │   │   ├── shared/          # Cross-role components (DataTable, badges, modals)
│   │   │   └── ui/              # Design-system primitives (Button, Card, Input, etc.)
│   │   ├── context/             # AuthContext
│   │   ├── hooks/               # useDebounce, usePagination, useNotifications
│   │   ├── pages/
│   │   │   ├── auth/            # Login, ForgotPassword, ResetPassword
│   │   │   ├── head/            # 15 Head Administrator pages
│   │   │   ├── faculty/         # 8 Faculty Supervisor pages
│   │   │   └── student/         # 8 Student pages
│   │   ├── tests/               # Vitest unit + integration tests
│   │   └── utils/               # formatters.js (date, CSV, etc.)
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                      # Express API
│   ├── config/db.js             # Mongoose connection
│   ├── controllers/             # One controller per resource
│   ├── middleware/              # auth, authorize, validate, errorHandler
│   ├── models/                  # 7 Mongoose models
│   ├── routes/                  # One router per resource
│   ├── schemas/                 # Zod validation schemas
│   ├── scripts/seed.js          # Database seeder
│   └── utils/                   # audit.js, qr.js, csv.js
└── package.json                 # Root scripts (dev, install:all, seed, test)
```

## Testing

```bash
# Run all tests (client + server)
npm test

# Client tests only (Vitest)
cd client && npm test

# Server tests only (Jest)
cd server && npm test
```

Tests include:
- Unit tests for UI components (Button, ProtectedRoute)
- Page-level tests (HeadDashboard, BulkImport, LoginPage)
- Integration tests for RSVP and Attendance flows

## Environment Variables

All variables live in `server/.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret key for JWT signing (use a long random string) |
| `JWT_EXPIRES_IN` | No | JWT expiry (default: `24h`) |
| `CLIENT_URL` | No | Frontend origin for CORS (default: `http://localhost:5173`) |
| `PORT` | No | Server port (default: `5000`) |
| `NODE_ENV` | No | `development` or `production` |
| `EMAIL_HOST` | No | SMTP host for password reset emails |
| `EMAIL_PORT` | No | SMTP port |
| `EMAIL_USER` | No | SMTP username |
| `EMAIL_PASS` | No | SMTP password |

## Deployment

```bash
# Build the client
cd client && npm run build
# Output: client/dist/

# Serve client/dist as static files from your Express server or a CDN.
# Set NODE_ENV=production in the server environment.
# Ensure MONGO_URI and JWT_SECRET are set as environment variables.
```
