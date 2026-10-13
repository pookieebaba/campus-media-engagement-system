require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');

const User = require('../models/User');
const Block = require('../models/Block');
const Event = require('../models/Event');
const EventParticipation = require('../models/EventParticipation');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

// NOTE: Do NOT pre-hash passwords here.
// The User model's pre-save hook hashes them automatically.
// Pre-hashing would result in a double-hash that never matches.

async function seed() {
  console.log('🌱 Starting seed...');

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✓ Connected to MongoDB');

  // ── Clean existing data ──────────────────────────────────────────────────
  console.log('🗑  Clearing existing data...');
  await Promise.all([
    AuditLog.deleteMany({}),
    Notification.deleteMany({}),
    Attendance.deleteMany({}),
    EventParticipation.deleteMany({}),
    Event.deleteMany({}),
    User.deleteMany({}),
    Block.deleteMany({}),
  ]);
  console.log('✓ Cleared existing data');

  // ── 1. Head user ──────────────────────────────────────────────────────────
  console.log('👤 Creating Head user...');
  const head = await User.create({
    name: 'Ramesh Chandra',
    email: 'head@cmes.edu',
    password: 'Head@2024!',
    role: 'head',
    isActive: true,
  });
  console.log('✓ Head user created:', head.email);

  // ── 2. Blocks ─────────────────────────────────────────────────────────────
  console.log('🏛  Creating blocks...');
  const blockDefs = [
    { name: 'Engineering & Technology', code: 'ET', description: 'Engineering and Technology block' },
    { name: 'Management & Technology', code: 'MT', description: 'Management and Technology block' },
    { name: 'Fashion & Design', code: 'FD', description: 'Fashion and Design block' },
    { name: 'Pharmacy', code: 'PHARMACY', description: 'Pharmacy block' },
  ];

  const blocks = await Block.insertMany(
    blockDefs.map((b) => ({ ...b, createdBy: head._id }))
  );

  const blockMap = {};
  blocks.forEach((b) => (blockMap[b.code] = b));
  console.log('✓ Blocks created:', blocks.map((b) => b.code).join(', '));

  // ── 3. Faculty users (one per block) ─────────────────────────────────────
  console.log('🎓 Creating faculty users...');
  const facultyDefs = [
    { name: 'Dr. Rajesh Kumar', email: 'faculty.et@cmes.edu', blockCode: 'ET' },
    { name: 'Prof. Sunita Sharma', email: 'faculty.mt@cmes.edu', blockCode: 'MT' },
    { name: 'Ms. Preethi Nair', email: 'faculty.fd@cmes.edu', blockCode: 'FD' },
    { name: 'Dr. Amit Patel', email: 'faculty.pharmacy@cmes.edu', blockCode: 'PHARMACY' },
  ];

  // Use create() one-by-one so the pre-save hook hashes each password
  const facultyUsers = [];
  for (const f of facultyDefs) {
    const faculty = await User.create({
      name: f.name,
      email: f.email,
      password: 'Faculty@2024!',
      role: 'faculty',
      block: blockMap[f.blockCode]._id,
      isActive: true,
    });
    facultyUsers.push(faculty);
  }

  const facultyMap = {};
  facultyDefs.forEach((def, i) => (facultyMap[def.blockCode] = facultyUsers[i]));
  console.log('✓ Faculty users created:', facultyUsers.map((f) => f.email).join(', '));

  // ── 4. Students (5 per block = 20 total) ─────────────────────────────────
  console.log('🧑‍🎓 Creating student users...');

  const studentNames = [
    // ET block
    ['Aarav Sharma', 'Priya Patel', 'Rohit Verma', 'Ananya Singh', 'Karan Mehta'],
    // MT block
    ['Sneha Iyer', 'Vikram Nair', 'Pooja Reddy', 'Arjun Gupta', 'Divya Joshi'],
    // FD block
    ['Ishaan Chopra', 'Meera Pillai', 'Rahul Desai', 'Kavya Menon', 'Aditya Rao'],
    // PHARMACY block
    ['Nisha Bhat', 'Suresh Kumar', 'Deepika Mishra', 'Nikhil Tiwari', 'Swati Pandey'],
  ];

  const blockCodes = ['ET', 'MT', 'FD', 'PHARMACY'];
  const students = [];

  for (let bi = 0; bi < blockCodes.length; bi++) {
    const code = blockCodes[bi];
    const block = blockMap[code];
    const supervisor = facultyMap[code];
    const names = studentNames[bi];

    for (let si = 0; si < 5; si++) {
      const num = String(si + 1).padStart(3, '0');
      const studentId = `${code}2024${num}`;
      const email = `${studentId}@student.cmes.edu`;
      // Use create() so the pre-save hook hashes the password
      const student = await User.create({
        name: names[si],
        email,
        password: 'Student@2024!',
        role: 'student',
        studentId,
        block: block._id,
        supervisor: supervisor._id,
        isActive: true,
      });
      students.push(student);
    }
  }
  console.log(`✓ ${students.length} student users created`);

  // ── 5. Events ──────────────────────────────────────────────────────────────
  console.log('📅 Creating events...');

  const now = new Date();
  const pastDate = new Date(now);
  pastDate.setDate(pastDate.getDate() - 14); // 2 weeks ago

  const upcomingDate = new Date(now);
  upcomingDate.setDate(upcomingDate.getDate() + 7); // 1 week from now

  const draftDate = new Date(now);
  draftDate.setDate(draftDate.getDate() + 21); // 3 weeks from now

  // Event 1: Completed — Annual Media Showcase
  const event1 = await Event.create({
    title: 'Annual Media Showcase',
    description:
      'The flagship annual event where campus media teams present their best work of the year — videos, photography, graphic design, and journalism projects.',
    date: pastDate,
    startTime: '10:00',
    endTime: '17:00',
    venue: 'Main Auditorium, Block A',
    status: 'completed',
    organizer: head._id,
    supervisors: [facultyMap['ET']._id, facultyMap['MT']._id],
    participatingBlocks: [blockMap['ET']._id, blockMap['MT']._id],
    assignedStudents: students
      .filter((s) => ['ET', 'MT'].some((c) => s.studentId.startsWith(c)))
      .map((s) => s._id),
    rsvpDeadline: new Date(pastDate.getTime() - 3 * 24 * 60 * 60 * 1000),
    checkInWindow: {
      start: new Date(pastDate.getTime() - 30 * 60 * 1000),
      end: new Date(pastDate.getTime() + 8 * 60 * 60 * 1000),
    },
  });

  // Event 2: Published/Upcoming — Photography Workshop
  const rsvpDeadline2 = new Date(upcomingDate);
  rsvpDeadline2.setDate(rsvpDeadline2.getDate() - 2);

  const event2 = await Event.create({
    title: 'Photography Workshop',
    description:
      'A hands-on photography workshop covering composition, lighting, and post-processing. Open to all students with an interest in visual media.',
    date: upcomingDate,
    startTime: '09:00',
    endTime: '13:00',
    venue: 'Studio Lab, FD Block',
    status: 'published',
    organizer: facultyMap['FD']._id,
    supervisors: [facultyMap['FD']._id, facultyMap['PHARMACY']._id],
    participatingBlocks: [blockMap['FD']._id, blockMap['PHARMACY']._id],
    assignedStudents: students
      .filter((s) => ['FD', 'PHARMACY'].some((c) => s.studentId.startsWith(c)))
      .map((s) => s._id),
    rsvpDeadline: rsvpDeadline2,
    checkInWindow: {
      start: new Date(upcomingDate.getTime() - 15 * 60 * 1000),
      end: new Date(upcomingDate.getTime() + 4 * 60 * 60 * 1000),
    },
  });

  // Event 3: Draft — Documentary Screening
  const event3 = await Event.create({
    title: 'Documentary Screening',
    description:
      'An evening screening of award-winning environmental documentaries, followed by a panel discussion with faculty and industry guests.',
    date: draftDate,
    startTime: '18:00',
    endTime: '21:00',
    venue: 'Lecture Hall 3, MT Block',
    status: 'draft',
    organizer: head._id,
    supervisors: [],
    participatingBlocks: [],
    assignedStudents: [],
    rsvpDeadline: new Date(draftDate.getTime() - 2 * 24 * 60 * 60 * 1000),
  });

  console.log('✓ Events created:', [event1.title, event2.title, event3.title].join(', '));

  // ── 6. EventParticipation records ─────────────────────────────────────────
  console.log('📋 Creating participation records...');

  // Event 1 — completed: all assigned students had RSVPs
  const event1Students = students.filter((s) =>
    ['ET', 'MT'].some((c) => s.studentId.startsWith(c))
  );

  const event1Participations = event1Students.map((student, idx) => ({
    event: event1._id,
    student: student._id,
    rsvpStatus: idx < 8 ? 'going' : idx < 9 ? 'not_going' : 'going',
    rsvpAt: new Date(pastDate.getTime() - 5 * 24 * 60 * 60 * 1000),
    changedAt: null,
  }));

  // Event 2 — upcoming: students have submitted RSVPs
  const event2Students = students.filter((s) =>
    ['FD', 'PHARMACY'].some((c) => s.studentId.startsWith(c))
  );

  const event2Participations = event2Students.map((student, idx) => ({
    event: event2._id,
    student: student._id,
    rsvpStatus: idx < 4 ? 'going' : idx < 6 ? 'not_going' : 'pending',
    rsvpAt: idx < 6 ? new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) : null,
    changedAt: null,
  }));

  await EventParticipation.insertMany([...event1Participations, ...event2Participations]);
  console.log(
    `✓ ${event1Participations.length + event2Participations.length} participation records created`
  );

  // ── 7. Attendance records for completed event ─────────────────────────────
  console.log('✅ Creating attendance records...');

  const event1GoingStudents = event1Students.filter((_, idx) => idx !== 8); // exclude not_going
  const attendanceRecords = event1GoingStudents.map((student, idx) => ({
    event: event1._id,
    student: student._id,
    faculty: facultyMap['ET']._id,
    status:
      idx < 7 ? 'present' : idx === 7 ? 'late' : 'absent',
    checkInMethod: idx < 7 ? 'qr' : idx === 7 ? 'manual' : undefined,
    checkInTime:
      idx < 7
        ? new Date(pastDate.getTime() + 5 * 60 * 1000) // 5 min after start
        : idx === 7
        ? new Date(pastDate.getTime() + 45 * 60 * 1000) // 45 min late
        : undefined,
    isFinalized: true,
    correctionHistory: [],
  }));

  const insertedAttendance = await Attendance.insertMany(attendanceRecords);
  console.log(`✓ ${insertedAttendance.length} attendance records created`);

  // ── 8. Notifications (5 per user = 125 total) ────────────────────────────
  console.log('🔔 Creating notifications...');

  const allNotifications = [];

  // Student notifications (5 per student × 20 students)
  students.forEach((student) => {
    const evRef = student.studentId.startsWith('FD') || student.studentId.startsWith('PHARMACY')
      ? event2._id
      : event1._id;
    const supervisorId = student.supervisor;

    allNotifications.push(
      {
        recipient: student._id,
        sender: head._id,
        type: 'event_published',
        title: 'You\'ve been assigned to an event',
        message: `You have been assigned to participate in an upcoming campus media event. Please check your events page for details.`,
        isRead: false,
        relatedEvent: evRef,
      },
      {
        recipient: student._id,
        sender: supervisorId,
        type: 'rsvp_reminder',
        title: 'RSVP Deadline Approaching',
        message: 'Please submit your RSVP for your upcoming event. The deadline is approaching in 2 days.',
        isRead: false,
        relatedEvent: evRef,
      },
      {
        recipient: student._id,
        sender: supervisorId,
        type: 'announcement',
        title: 'Important Announcement from Your Supervisor',
        message: 'Please ensure you have completed all pre-event preparations. Attendance is mandatory for all assigned students.',
        isRead: true,
        relatedEvent: evRef,
      },
      {
        recipient: student._id,
        sender: supervisorId,
        type: 'attendance_correction',
        title: 'Attendance Record Updated',
        message: 'Your attendance record has been reviewed and updated by your faculty supervisor. Please contact them if you have any questions.',
        isRead: false,
        relatedEvent: evRef,
      },
      {
        recipient: student._id,
        sender: head._id,
        type: 'system',
        title: 'Welcome to CMES',
        message: 'Welcome to the Campus Media Engagement System! Use this platform to manage your event RSVPs and check-ins.',
        isRead: true,
      }
    );
  });

  // Faculty notifications (5 per faculty × 4 faculty)
  facultyUsers.forEach((faculty, idx) => {
    const evRef = idx < 2 ? event1._id : event2._id;
    allNotifications.push(
      {
        recipient: faculty._id,
        sender: head._id,
        type: 'assignment',
        title: 'Supervisor Assignment',
        message: 'You have been assigned as a supervisor for an upcoming campus media event. Please review the event details.',
        isRead: true,
        relatedEvent: evRef,
      },
      {
        recipient: faculty._id,
        sender: head._id,
        type: 'rsvp_submitted',
        title: 'Student RSVP Update',
        message: 'Several students have submitted their RSVPs for your supervised event. Please review the participant list.',
        isRead: false,
        relatedEvent: evRef,
      },
      {
        recipient: faculty._id,
        sender: head._id,
        type: 'attendance_finalized',
        title: 'Reminder: Finalize Attendance',
        message: 'Please remember to finalize attendance records for completed events under your supervision.',
        isRead: false,
        relatedEvent: evRef,
      },
      {
        recipient: faculty._id,
        sender: head._id,
        type: 'event_cancelled',
        title: 'Event Update',
        message: 'An event you were assigned to supervise has been updated. Please check the events page for the latest information.',
        isRead: true,
        relatedEvent: evRef,
      },
      {
        recipient: faculty._id,
        sender: head._id,
        type: 'system',
        title: 'Welcome to CMES',
        message: 'Welcome to the Campus Media Engagement System! Use the faculty dashboard to manage your supervised events and student attendance.',
        isRead: true,
      }
    );
  });

  // Head notifications (5)
  allNotifications.push(
    {
      recipient: head._id,
      sender: head._id,
      type: 'event_published',
      title: 'Event Published: Photography Workshop',
      message: 'The Photography Workshop has been published and is now visible to assigned students.',
      isRead: false,
      relatedEvent: event2._id,
    },
    {
      recipient: head._id,
      sender: head._id,
      type: 'rsvp_summary',
      title: 'Photography Workshop RSVP Summary',
      message: 'Photography Workshop RSVP summary: 4 going, 2 not going, 4 pending.',
      isRead: false,
      relatedEvent: event2._id,
    },
    {
      recipient: head._id,
      sender: head._id,
      type: 'attendance_exception',
      title: 'Attendance Exception Alert',
      message: '3 students were marked absent without an excuse at the Annual Media Showcase. Please review.',
      isRead: true,
      relatedEvent: event1._id,
    },
    {
      recipient: head._id,
      sender: head._id,
      type: 'user_created',
      title: 'New Users Added',
      message: 'Successfully added 20 student accounts and 4 faculty accounts to the system.',
      isRead: true,
    },
    {
      recipient: head._id,
      sender: head._id,
      type: 'system',
      title: 'Seed Complete',
      message: 'The Campus Media Engagement System has been seeded with test data. Review the defaults in this notification.',
      isRead: false,
    }
  );

  await Notification.insertMany(allNotifications);
  console.log(`✓ ${allNotifications.length} notifications created`);

  // ── 9. AuditLog entries ───────────────────────────────────────────────────
  console.log('📝 Creating audit log entries...');

  const auditLogs = [
    {
      actor: head._id,
      action: 'user_create',
      targetType: 'User',
      targetId: facultyUsers[0]._id,
      changes: {
        before: null,
        after: { name: facultyUsers[0].name, email: facultyUsers[0].email, role: 'faculty' },
      },
    },
    {
      actor: head._id,
      action: 'user_create',
      targetType: 'User',
      targetId: facultyUsers[1]._id,
      changes: {
        before: null,
        after: { name: facultyUsers[1].name, email: facultyUsers[1].email, role: 'faculty' },
      },
    },
    {
      actor: head._id,
      action: 'event_publish',
      targetType: 'Event',
      targetId: event2._id,
      changes: {
        before: { status: 'draft' },
        after: { status: 'published' },
      },
    },
    {
      actor: facultyMap['ET']._id,
      action: 'attendance_correct',
      targetType: 'Attendance',
      targetId: insertedAttendance[0]?._id ?? event1._id,
      changes: {
        before: { status: 'absent' },
        after: { status: 'present', reason: 'Student was present but QR failed to scan' },
      },
    },
    {
      actor: head._id,
      action: 'event_cancel',
      targetType: 'Event',
      targetId: event3._id,
      changes: {
        before: { status: 'draft' },
        after: { status: 'cancelled', cancelReason: 'Venue unavailable' },
      },
    },
    {
      actor: head._id,
      action: 'user_deactivate',
      targetType: 'User',
      targetId: students[19]._id,
      changes: {
        before: { isActive: true },
        after: { isActive: false },
      },
    },
    {
      actor: head._id,
      action: 'bulk_import',
      targetType: 'User',
      targetId: null,
      changes: {
        before: null,
        after: { created: 5, failed: 0, role: 'student' },
      },
    },
    {
      actor: head._id,
      action: 'block_create',
      targetType: 'Block',
      targetId: blockMap['ET']._id,
      changes: {
        before: null,
        after: { name: 'Engineering & Technology', code: 'ET' },
      },
    },
    {
      actor: head._id,
      action: 'user_update',
      targetType: 'User',
      targetId: facultyUsers[2]._id,
      changes: {
        before: { name: 'Ms. Clara Reyes' },
        after: { name: 'Dr. Clara Reyes' },
      },
    },
    {
      actor: facultyMap['FD']._id,
      action: 'attendance_correct',
      targetType: 'Attendance',
      targetId: event2._id,
      changes: {
        before: { status: 'absent' },
        after: { status: 'excused', reason: 'Student provided medical certificate' },
      },
    },
  ];

  await AuditLog.insertMany(auditLogs);
  console.log(`✓ ${auditLogs.length} audit log entries created`);

  // ── Done ─────────────────────────────────────────────────────────────────
  console.log('\n✓ Seed complete\n');
  console.log('  Seed credentials:');
  console.log('  Head:    head@cmes.edu            / Head@2024!');
  console.log('  Faculty: faculty.et@cmes.edu       / Faculty@2024!');
  console.log('  Student: ET2024001@student.cmes.edu / Student@2024!');
  console.log('');
  console.log(`  Notifications: ${allNotifications.length}`);
  console.log(`  Audit logs:    ${auditLogs.length}`);
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
