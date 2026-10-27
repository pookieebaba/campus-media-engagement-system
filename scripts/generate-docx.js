const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  AlignmentType, PageBreak, ShadingType,
} = require('docx');
const fs = require('fs');
const path = require('path');

const MOSS   = '5D7052';
const TERRA  = 'C18C5D';
const DARK   = '2C2C24';
const LIGHT  = 'F0EBE5';
const WHITE  = 'FFFFFF';

function h1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    run: { color: DARK, bold: true, size: 48 },
  });
}

function h2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160 },
    thematicBreak: true,
  });
}

function h3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 26, color: MOSS })],
    spacing: { before: 280, after: 120 },
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: DARK, ...opts })],
    spacing: { before: 80, after: 80 },
  });
}

function bullet(text) {
  return new Paragraph({
    text,
    bullet: { level: 0 },
    spacing: { before: 40, after: 40 },
    run: { size: 22, color: DARK },
  });
}

function code(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: 'Courier New', size: 18, color: '5D7052' })],
    spacing: { before: 60, after: 60 },
    shading: { type: ShadingType.SOLID, color: 'F5F0EA' },
    indent: { left: 360 },
  });
}

function techTable(rows) {
  const headerRow = new TableRow({
    children: ['Technology', 'Version', 'Why It Was Used'].map(t =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: WHITE, size: 22 })] })],
        shading: { type: ShadingType.SOLID, color: MOSS },
        width: { size: t === 'Why It Was Used' ? 55 : 22, type: WidthType.PERCENTAGE },
      })
    ),
  });

  const dataRows = rows.map((r, i) =>
    new TableRow({
      children: r.map((cell, ci) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20, color: ci === 0 ? MOSS : DARK, bold: ci === 0 })] })],
          shading: i % 2 === 0 ? undefined : { type: ShadingType.SOLID, color: LIGHT },
        })
      ),
    })
  );

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function simpleTable(headers, rows) {
  const headerRow = new TableRow({
    children: headers.map(t =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: WHITE, size: 20 })] })],
        shading: { type: ShadingType.SOLID, color: TERRA },
      })
    ),
  });
  const dataRows = rows.map((r, i) =>
    new TableRow({
      children: r.map(cell =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: cell, size: 20, color: DARK })] })],
          shading: i % 2 === 0 ? undefined : { type: ShadingType.SOLID, color: LIGHT },
        })
      ),
    })
  );
  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

const doc = new Document({
  title: 'Campus Media Engagement System — Documentation',
  styles: {
    paragraphStyles: [
      {
        id: 'Normal',
        run: { font: 'Calibri', size: 22 },
      },
    ],
  },
  sections: [{
    properties: {
      page: { margin: { top: 1080, bottom: 1080, left: 1080, right: 1080 } },
    },
    children: [

      // ── COVER ──────────────────────────────────────────────────────────────
      new Paragraph({
        children: [new TextRun({ text: 'TECHNICAL DOCUMENTATION', size: 20, color: MOSS, bold: true })],
        spacing: { before: 1440, after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Campus Media', size: 64, bold: true, color: DARK })],
        spacing: { after: 0 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Engagement System', size: 64, bold: true, color: MOSS })],
        spacing: { after: 320 },
      }),
      para('A full-stack web application for managing campus media events, student participation, faculty supervision, and attendance tracking across academic blocks.'),
      new Paragraph({ spacing: { before: 400, after: 100 }, children: [new TextRun({ text: '─────────────────────────────────────────', color: 'DED8CF' })] }),
      para(`Stack: MERN (MongoDB · Express · React · Node.js)`, { bold: true }),
      para('Version: 1.0.0 — Production Ready'),
      para('Roles: Head Administrator · Faculty Supervisor · Student'),
      para('Pages: 31 total (15 Head + 8 Faculty + 8 Student)'),
      para('API Endpoints: 40+ REST endpoints'),
      para('Test Coverage: 75 tests (44 backend + 31 frontend)'),

      pageBreak(),

      // ── 1. PURPOSE ─────────────────────────────────────────────────────────
      h2('1. Purpose & Overview'),
      para('The Campus Media Engagement System (CMES) is an operational management platform designed for colleges to coordinate campus media activities. It handles student participation, faculty supervision, event attendance, and reporting across multiple academic blocks.'),
      para('CMES is not a social network or a content platform. It is a structured administrative system where every action — from creating an event to marking attendance — is tracked, role-restricted, and auditable.'),
      para('The system manages four academic blocks by default:', { bold: true }),
      bullet('ET — Engineering & Technology'),
      bullet('MT — Management & Technology'),
      bullet('FD — Fashion & Design'),
      bullet('Pharmacy'),
      para('The Head Administrator can add more blocks at any time.'),

      // ── 2. TECH STACK ──────────────────────────────────────────────────────
      h2('2. Technology Stack & Why Each Was Chosen'),

      h3('Frontend Technologies'),
      techTable([
        ['React', '18.3.1', 'Component-based UI with hooks. Ideal for complex role-based dashboards. v18 chosen over v19 for Recharts compatibility.'],
        ['Vite', '6.3.5', 'Faster dev server and build compared to Create React App. Native ESM and instant hot module replacement.'],
        ['React Router', '6.30.0', 'Client-side routing with nested protected routes per role. v6 API used — v7 has breaking changes.'],
        ['Tailwind CSS', '3.4.19', 'Utility-first CSS for rapid, consistent styling. Custom design tokens (moss, terracotta, sand). v3 used — v4 is incompatible with tailwind.config.js setup.'],
        ['Axios', '1.9.0', 'Centralized HTTP client with interceptors. 401 interceptor auto-redirects to login on session expiry.'],
        ['Recharts', '2.15.3', 'React-native charting library for the block-wise participation bar chart. Requires React 18.'],
        ['Lucide React', '0.511.0', 'Clean icon set matching the organic design. Tree-shakeable — only used icons are bundled.'],
      ]),

      h3('Backend Technologies'),
      techTable([
        ['Node.js', '18+', 'JavaScript runtime enabling one language across frontend and backend, sharing validation logic.'],
        ['Express', '5.1.0', 'Minimal HTTP framework. v5 handles async errors automatically without try/catch in every route.'],
        ['MongoDB', '6+', 'Document database for flexible schema — events have varying participant arrays and correction histories without complex joins.'],
        ['Mongoose', '8.16.4', 'ODM with schema validation, pre-save hooks (password hashing), and population. Makes it impossible to accidentally store plaintext passwords.'],
        ['JWT', '9.0.3', 'Stateless auth stored in httpOnly cookies — inaccessible to JavaScript, preventing XSS token theft. 24-hour expiry.'],
        ['bcryptjs', '3.0.3', 'Password hashing with 12 salt rounds. Pure JavaScript — no native bindings, reliable across deployment environments.'],
        ['Zod', '3.25.49', 'Schema-first validation on every route. Invalid requests rejected before reaching controller. Prevents mass assignment.'],
        ['Helmet', '8.0.0', 'Sets 14 security HTTP headers automatically (CSP, X-Frame-Options, HSTS, etc.) with a single middleware call.'],
        ['express-rate-limit', '7.5.0', 'Prevents brute-force. Auth routes: 5/15min in production. All routes: 100/15min.'],
        ['Nodemailer', '6.10.1', 'Password reset emails. Auto-creates Ethereal test account in development — no SMTP config needed. Uses real SMTP in production.'],
        ['csv-parse', '5.6.0', 'Server-side CSV parsing for bulk student import. Every row validated with Zod before insertion.'],
        ['qrcode', '1.5.4', 'Generates QR data URLs. Tokens are 32-byte random, SHA-256 hashed, expire 30 min after event ends.'],
      ]),

      h3('Testing'),
      techTable([
        ['Jest + Supertest', 'Backend', '44 tests for auth, users, events. HTTP-level testing of Express routes without starting a real server.'],
        ['Vitest + RTL', 'Frontend', '31 tests for components, auth flow, integration. Vite-native runner — same config, near-instant runs.'],
      ]),

      pageBreak(),

      // ── 3. ARCHITECTURE ────────────────────────────────────────────────────
      h2('3. System Architecture'),

      h3('Project Structure'),
      code('campus-media-engagement-system/'),
      code('├── client/                  # React + Vite frontend'),
      code('│   ├── src/'),
      code('│   │   ├── api/             # Axios client + per-domain API modules'),
      code('│   │   ├── components/'),
      code('│   │   │   ├── ui/          # Design system primitives'),
      code('│   │   │   ├── layout/      # AppShell, Sidebar, Navbar, ProtectedRoute'),
      code('│   │   │   └── shared/      # Badges, modals, QR display, export'),
      code('│   │   ├── context/         # AuthContext (global auth state)'),
      code('│   │   ├── hooks/           # useDebounce, usePagination, useNotifications'),
      code('│   │   └── pages/           # 31 pages across 3 roles'),
      code('├── server/                  # Node.js + Express backend'),
      code('│   ├── controllers/         # Business logic (9 controllers)'),
      code('│   ├── middleware/          # auth, authorize, validate, rateLimiter'),
      code('│   ├── models/              # 7 Mongoose models'),
      code('│   ├── routes/              # 9 Express routers'),
      code('│   ├── schemas/             # 7 Zod validation schemas'),
      code('│   └── utils/               # audit, qr, mailer, csv helpers'),
      code('└── package.json             # Root scripts (dev, seed, test)'),

      h3('Request Flow'),
      para('1. Browser → React component calls an API function (e.g. listEvents())'),
      para('2. Axios client → attaches httpOnly cookie via withCredentials: true'),
      para('3. Vite proxy (dev) → forwards /api/* to localhost:5000'),
      para('4. Express middleware chain → Helmet → CORS → rate limiter → cookie parser'),
      para('5. verifyToken → extracts JWT from cookie, verifies signature, attaches req.user'),
      para('6. authorize() → checks req.user.role against allowed roles. Returns 403 if denied.'),
      para('7. validate() → runs Zod schema against req.body. Returns 400 if invalid.'),
      para('8. Controller → queries MongoDB, applies business logic, returns JSON'),
      para('9. React → updates state, re-renders UI'),

      pageBreak(),

      // ── 4. USER ROLES ──────────────────────────────────────────────────────
      h2('4. User Roles & Permissions'),
      para('Every permission is enforced on the backend. Hiding a UI button is never the security boundary.'),

      h3('Head Administrator'),
      bullet('Manage blocks, faculty, and students'),
      bullet('Create, publish, update, and cancel events'),
      bullet('Assign faculty supervisors and student participants'),
      bullet('View all RSVPs and attendance'),
      bullet('Institution-wide analytics and reports'),
      bullet('CSV bulk import and export'),
      bullet('Audit logs access'),
      bullet('Account activation and deactivation'),

      h3('Faculty Supervisor'),
      bullet('View only their assigned students'),
      bullet('View only their supervised events'),
      bullet('Mark attendance (manual or QR verification)'),
      bullet('Correct attendance records with a reason'),
      bullet('Finalize the attendance register'),
      bullet('Send announcements to assigned students'),
      bullet('Generate event QR codes'),

      h3('Student'),
      bullet('View only their assigned events'),
      bullet('Submit RSVP (Going / Not Going) — changeable before deadline'),
      bullet('QR token check-in during the check-in window'),
      bullet('View their own attendance history'),
      bullet('Receive notifications and announcements'),
      bullet('Update own profile and password'),

      pageBreak(),

      // ── 5. EVENT WORKFLOW ──────────────────────────────────────────────────
      h2('5. Complete Event Workflow'),

      h3('Step-by-Step Flow'),
      para('Step 1 — Block Setup', { bold: true }),
      para('Head creates academic blocks. Each block is assigned a faculty supervisor.'),
      para('Step 2 — User Registration', { bold: true }),
      para('Head registers faculty and students. Students receive a unique college-issued Student ID, linked to their block and supervisor.'),
      para('Step 3 — Event Creation', { bold: true }),
      para('Head or authorized faculty creates an event as a draft. Specifies date, time, venue, RSVP deadline, check-in window, participating blocks, assigned students, and supervisors.'),
      para('Step 4 — Publication', { bold: true }),
      para('Head publishes the event. EventParticipation records are auto-created for all assigned students with status pending. Notifications are dispatched.'),
      para('Step 5 — RSVP Collection', { bold: true }),
      para('Students log in, see the event on their dashboard, and submit Going or Not Going. They can change their response before the RSVP deadline.'),
      para('Step 6 — Faculty Review', { bold: true }),
      para('Faculty sees the live RSVP breakdown: going, not going, and pending counts. RSVP and attendance are entirely separate records.'),
      para('Step 7 — Check-in Day (QR)', { bold: true }),
      para('Faculty opens the QR Attendance page. A time-limited cryptographic QR token is generated. Students scan/enter the token on their Check-in page. Each creates an Attendance record. Duplicates are rejected by a unique database index.'),
      para('Step 8 — Manual Recording', { bold: true }),
      para('Faculty marks late arrivals, absences, and excused absences from the Attendance Register. All changes are logged in a correction history array.'),
      para('Step 9 — Finalization', { bold: true }),
      para('Faculty finalizes the attendance register. Records become read-only. Further corrections require a written reason and create an AuditLog entry.'),
      para('Step 10 — Head Review', { bold: true }),
      para('Head dashboard shows expected vs actual attendance, unresolved exceptions, and block-wise participation charts. Reports exported as CSV.'),

      pageBreak(),

      // ── 6. DATABASE MODELS ─────────────────────────────────────────────────
      h2('6. Database Models'),

      h3('User'),
      bullet('name, email, password (hashed with bcrypt)'),
      bullet('role: head | faculty | student'),
      bullet('studentId (unique, sparse — only students)'),
      bullet('block → ref Block, supervisor → ref User'),
      bullet('isActive, lastLoginAt'),
      bullet('passwordResetToken (SHA-256 hashed), passwordResetExpires'),

      h3('Block'),
      bullet('name, code (unique), description'),
      bullet('isActive, createdBy → ref User'),

      h3('Event'),
      bullet('title, description, venue, date, startTime, endTime'),
      bullet('status: draft | published | ongoing | completed | cancelled'),
      bullet('organizer → ref User, supervisors[] → ref User'),
      bullet('assignedStudents[] → ref User, participatingBlocks[] → ref Block'),
      bullet('rsvpDeadline, checkInWindow { start, end }'),
      bullet('qrToken (hashed), qrTokenExpires, cancelReason'),

      h3('EventParticipation'),
      bullet('event → ref Event, student → ref User'),
      bullet('rsvpStatus: pending | going | not_going'),
      bullet('rsvpAt, changedAt'),
      bullet('UNIQUE compound index: { event, student }'),

      h3('Attendance'),
      bullet('event → ref Event, student → ref User, faculty → ref User'),
      bullet('status: present | absent | late | excused'),
      bullet('checkInMethod: qr | manual | faculty_verified'),
      bullet('isFinalized'),
      bullet('correctionHistory: [{ correctedBy, previousStatus, newStatus, reason, correctedAt }]'),
      bullet('UNIQUE compound index: { event, student }'),

      h3('Notification'),
      bullet('recipient → ref User, sender → ref User (optional)'),
      bullet('type, title, message, isRead'),
      bullet('relatedEvent → ref Event (optional)'),

      h3('AuditLog'),
      bullet('actor → ref User, action (string)'),
      bullet('targetType, targetId'),
      bullet('changes: { before, after }'),
      bullet('ipAddress, createdAt'),

      pageBreak(),

      // ── 7. SECURITY ────────────────────────────────────────────────────────
      h2('7. Security Implementation'),

      h3('Security Measures'),
      simpleTable(['Measure', 'Implementation'],
        [
          ['Password Hashing', 'bcryptjs with 12 salt rounds in Mongoose pre-save hook'],
          ['Authentication', 'JWT stored in httpOnly cookie — inaccessible to JavaScript'],
          ['HTTP Headers', 'Helmet sets 14 security headers on every response'],
          ['Rate Limiting', 'Auth: 5 req/15min (prod). General: 100 req/15min'],
          ['Input Validation', 'Zod schemas on every route that accepts a request body'],
          ['NoSQL Injection', 'express-mongo-sanitize strips $ and . from inputs'],
          ['CORS', 'Allowlist-only origin with credentials — no wildcard'],
          ['Password Reset', '32-byte random token, SHA-256 hashed in DB, 1hr expiry'],
          ['QR Tokens', '32-byte random token, SHA-256 hashed, expires at event end + 30min'],
          ['Duplicate Prevention', 'Unique compound index {event, student} on Attendance and EventParticipation'],
          ['CSV Import', 'Every row validated with Zod before any insert'],
          ['Audit Trail', 'AuditLog created for user create/deactivate, event publish/cancel, attendance correction'],
          ['Role Enforcement', 'Server-side role check on every protected route — never trusted from client'],
        ]
      ),

      pageBreak(),

      // ── 8. PAGES ───────────────────────────────────────────────────────────
      h2('8. Application Pages'),

      h3('Head Administrator — 15 Pages'),
      simpleTable(['Page', 'Description'], [
        ['Overview / Dashboard', 'Stats, Recharts participation chart, recent events, attendance exceptions'],
        ['Events', 'Paginated event list with status filters, search, create button'],
        ['Create / Edit Event', 'Full event form with block selector, student multi-select, supervisor assignment'],
        ['Event Detail', 'RSVP breakdown, participant list, publish / cancel actions'],
        ['Blocks', 'Create, edit, deactivate academic blocks'],
        ['Students', 'Paginated directory, search by name/ID, filter by block'],
        ['Student Detail', 'Profile, participation history, attendance history'],
        ['CSV Import', 'Upload CSV, row-level results, download template'],
        ['Faculty', 'Faculty list, add faculty, activate/deactivate'],
        ['Faculty Detail', 'Assigned students, supervised events'],
        ['Attendance Overview', 'Filter by event/block/date, expected vs actual'],
        ['Reports', 'Attendance and participation reports with CSV export'],
        ['Notifications', 'All notifications with read/unread state'],
        ['Audit Logs', 'Paginated log of all sensitive admin actions'],
        ['Settings', 'Change password, update profile'],
      ]),

      h3('Faculty Supervisor — 8 Pages'),
      simpleTable(['Page', 'Description'], [
        ['Dashboard', 'Assigned students count, upcoming events, RSVP summary'],
        ['My Events', 'Events I supervise with status and participant counts'],
        ['Event Detail', 'Participant list with RSVP status'],
        ['Attendance Register', 'Full register: RSVP vs attendance, set status, correct, finalize'],
        ['QR Attendance', 'Live QR code display with refresh button'],
        ['My Students', 'All students under my supervision'],
        ['Announcements', 'Send announcement to all assigned students'],
        ['Notifications', 'My notifications'],
      ]),

      h3('Student — 8 Pages'),
      simpleTable(['Page', 'Description'], [
        ['Dashboard', 'Welcome card (name, ID, block, supervisor), upcoming events, notifications'],
        ['My Events', 'All assigned events with RSVP status'],
        ['Event Detail', 'Full event info, RSVP action, check-in button'],
        ['QR Check-in', 'Token entry, success/already-checked-in/window-closed states'],
        ['My Participation', 'All RSVPs with event details and attendance outcome'],
        ['Attendance History', 'Full attendance record filtered by status'],
        ['Notifications', 'All my notifications'],
        ['Profile', 'View profile, change password'],
      ]),

      pageBreak(),

      // ── 9. LOCAL SETUP ─────────────────────────────────────────────────────
      h2('9. Local Development Setup'),

      h3('Prerequisites'),
      bullet('Node.js 18 or higher'),
      bullet('MongoDB running locally (via Compass) or a MongoDB Atlas URI'),
      bullet('npm 9 or higher'),

      h3('Commands'),
      code('# 1. Navigate to project folder'),
      code('cd campus-media-engagement-system'),
      code(''),
      code('# 2. Install all dependencies (run once)'),
      code('npm run install:all'),
      code(''),
      code('# 3. Seed the database (run once, or to reset data)'),
      code('npm run seed'),
      code(''),
      code('# 4. Start both servers'),
      code('npm run dev'),
      code(''),
      code('# Frontend: http://localhost:5173'),
      code('# Backend:  http://localhost:5000'),
      code(''),
      code('# Run all tests'),
      code('npm test'),

      h3('Default Login Credentials'),
      simpleTable(['Role', 'Email', 'Password'], [
        ['Head Administrator', 'head@cmes.edu', 'Head@2024!'],
        ['Faculty – ET', 'faculty.et@cmes.edu', 'Faculty@2024!'],
        ['Faculty – MT', 'faculty.mt@cmes.edu', 'Faculty@2024!'],
        ['Faculty – FD', 'faculty.fd@cmes.edu', 'Faculty@2024!'],
        ['Faculty – Pharmacy', 'faculty.pharmacy@cmes.edu', 'Faculty@2024!'],
        ['Student – ET Block', 'ET2024001@student.cmes.edu', 'Student@2024!'],
        ['Student – FD Block', 'FD2024001@student.cmes.edu', 'Student@2024!'],
      ]),

      h3('Environment Variables (server/.env)'),
      code('MONGO_URI=mongodb://localhost:27017/cmes'),
      code('JWT_SECRET=your_random_secret_here'),
      code('JWT_EXPIRES_IN=24h'),
      code('PORT=5000'),
      code('NODE_ENV=development'),
      code('CLIENT_URL=http://localhost:5173'),

      pageBreak(),

      // ── 10. API ────────────────────────────────────────────────────────────
      h2('10. API Reference'),
      simpleTable(['Method', 'Endpoint', 'Access', 'Description'], [
        ['POST', '/api/auth/login', 'Public', 'Authenticate, set JWT cookie'],
        ['GET', '/api/auth/me', 'All', 'Get current user profile'],
        ['POST', '/api/auth/logout', 'All', 'Clear JWT cookie'],
        ['POST', '/api/auth/forgot-password', 'Public', 'Send password reset email'],
        ['POST', '/api/auth/reset-password/:token', 'Public', 'Reset password with token'],
        ['GET', '/api/users', 'Head', 'List users (paginated, filterable)'],
        ['POST', '/api/users', 'Head', 'Create faculty or student'],
        ['POST', '/api/users/bulk-import', 'Head', 'CSV bulk import students'],
        ['GET', '/api/blocks', 'All', 'List all blocks'],
        ['POST', '/api/blocks', 'Head', 'Create block'],
        ['GET', '/api/events', 'All', 'List events (role-filtered)'],
        ['POST', '/api/events', 'Head/Faculty', 'Create event'],
        ['PATCH', '/api/events/:id/publish', 'Head', 'Publish draft event'],
        ['PATCH', '/api/events/:id/cancel', 'Head', 'Cancel event'],
        ['GET', '/api/events/:id/qr', 'Faculty/Head', 'Generate QR code data URL'],
        ['POST', '/api/participation/:eventId/rsvp', 'Student', 'Submit RSVP'],
        ['GET', '/api/participation/my', 'Student', 'My participation records'],
        ['GET', '/api/attendance/:eventId', 'Faculty/Head', 'List attendance for event'],
        ['POST', '/api/attendance/qr-checkin', 'Student', 'Check in via QR token'],
        ['POST', '/api/attendance/:eventId/manual', 'Faculty/Head', 'Manual attendance entry'],
        ['PATCH', '/api/attendance/:eventId/finalize', 'Faculty/Head', 'Finalize attendance'],
        ['GET', '/api/reports/attendance', 'Head', 'Attendance report'],
        ['GET', '/api/reports/export/attendance', 'Head', 'Download attendance CSV'],
        ['GET', '/api/reports/export/participation', 'Head', 'Download participation CSV'],
        ['GET', '/api/notifications', 'All', 'My notifications'],
        ['POST', '/api/notifications/announce', 'Faculty', 'Announce to my students'],
        ['GET', '/api/audit-logs', 'Head', 'Paginated audit log'],
      ]),

      new Paragraph({
        children: [new TextRun({ text: '─────────────────────────────────────────', color: 'DED8CF' })],
        spacing: { before: 600, after: 200 },
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Campus Media Engagement System — Technical Documentation v1.0', size: 18, color: '9A9A88' })],
        alignment: AlignmentType.CENTER,
      }),
      new Paragraph({
        children: [new TextRun({ text: 'Built with MERN Stack · React 18 · Express 5 · MongoDB · Tailwind CSS', size: 18, color: '9A9A88' })],
        alignment: AlignmentType.CENTER,
        spacing: { after: 0 },
      }),
    ],
  }],
});

Packer.toBuffer(doc).then(buffer => {
  const outPath = path.join(__dirname, '..', 'CMES-Documentation.docx');
  fs.writeFileSync(outPath, buffer);
  const size = (buffer.length / 1024).toFixed(1);
  console.log(`✅ DOCX created: ${outPath} (${size} KB)`);
}).catch(err => {
  console.error('❌ Failed:', err.message);
});
