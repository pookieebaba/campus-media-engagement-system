require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Block = require('../models/Block');
const Event = require('../models/Event');
const EventParticipation = require('../models/EventParticipation');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

const SALT_ROUNDS = 12;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

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
  const headPassword = await hashPassword('Head@2024!');
  const head = await User.create({
    name: 'Head Administrator',
    email: 'head@cmes.edu',
    password: headPassword,
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
  const facultyPassword = await hashPassword('Faculty@2024!');
  const facultyDefs = [
    { name: 'Dr. Alice Morgan', email: 'faculty.et@cmes.edu', blockCode: 'ET' },
    { name: 'Prof. Brian Kwame', email: 'faculty.mt@cmes.edu', blockCode: 'MT' },
    { name: 'Ms. Clara Reyes', email: 'faculty.fd@cmes.edu', blockCode: 'FD' },
    { name: 'Dr. David Osei', email: 'faculty.pharmacy@cmes.edu', blockCode: 'PHARMACY' },
  ];

  const facultyUsers = await User.insertMany(
    facultyDefs.map((f) => ({
      name: f.name,
      email: f.email,
      password: facultyPassword,
      role: 'faculty',
      block: blockMap[f.blockCode]._id,
      isActive: true,
    }))
  );

  const facultyMap = {};
  facultyDefs.forEach((def, i) => (facultyMap[def.blockCode] = facultyUsers[i]));
  console.log('✓ Faculty users created:', facultyUsers.map((f) => f.email).join(', '));

  // ── 4. Students (5 per block = 20 total) ─────────────────────────────────
  console.log('🧑‍🎓 Creating student users...');
  const studentPassword = await hashPassword('Student@2024!');

  const studentNames = [
    ['Aisha Patel', 'Rohan Verma', 'Simone Lee', 'Carlos Diaz', 'Emma Okafor'],
    ['Yusuf Hassan', 'Mia Johansson', 'Liam Chen', 'Fatima Al-Amin', 'Noah Mensah'],
    ['Zara Williams', 'Oscar Fernandez', 'Nadia Kowalski', 'Arjun Singh', 'Lily Thompson'],
    ['Kwame Asante', 'Priya Nair', 'Felix Weber', 'Amara Diallo', 'Jake Nguyen'],
  ];

  const blockCodes = ['ET', 'MT', 'FD', 'PHARMACY'];
  const allStudents = [];

  for (let bi = 0; bi < blockCodes.length; bi++) {
    const code = blockCodes[bi];
    const block = blockMap[code];
    const supervisor = facultyMap[code];
    const names = studentNames[bi];

    for (let si = 0; si < 5; si++) {
      const num = String(si + 1).padStart(3, '0');
      const studentId = `${code}2024${num}`;
      const email = `${studentId}@student.cmes.edu`;
      allStudents.push({
        name: names[si],
        email,
        password: studentPassword,
        role: 'student',
        studentId,
        block: block._id,
        supervisor: supervisor._id,
        isActive: true,
      });
    }
  }

  const students = await User.insertMany(allStudents);
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

  await Attendance.insertMany(attendanceRecords);
  console.log(`✓ ${attendanceRecords.length} attendance records created`);

  // ── 8. Notifications ──────────────────────────────────────────────────────
  console.log('🔔 Creating notifications...');

  const sampleStudents = students.slice(0, 5);
  const notifications = [
    {
      recipient: sampleStudents[0]._id,
      sender: head._id,
      type: 'event_published',
      title: 'New Event: Photography Workshop',
      message: 'You have been assigned to the Photography Workshop on ' + upcomingDate.toDateString() + '.',
      isRead: false,
      relatedEvent: event2._id,
    },
    {
      recipient: sampleStudents[1]._id,
      sender: facultyMap['ET']._id,
      type: 'announcement',
      title: 'Attendance Reminder',
      message: 'Please remember to check in at the Annual Media Showcase. Your attendance has been recorded.',
      isRead: true,
      relatedEvent: event1._id,
    },
    {
      recipient: sampleStudents[2]._id,
      sender: head._id,
      type: 'rsvp_reminder',
      title: 'RSVP Deadline Approaching',
      message: 'The RSVP deadline for Photography Workshop is in 2 days. Please respond.',
      isRead: false,
      relatedEvent: event2._id,
    },
    {
      recipient: facultyMap['ET']._id,
      sender: head._id,
      type: 'assignment',
      title: 'Supervisor Assignment',
      message: 'You have been assigned as a supervisor for the Annual Media Showcase.',
      isRead: true,
      relatedEvent: event1._id,
    },
    {
      recipient: sampleStudents[3]._id,
      sender: facultyMap['FD']._id,
      type: 'attendance_correction',
      title: 'Attendance Updated',
      message: 'Your attendance for Photography Workshop has been updated. Please contact your supervisor if you have questions.',
      isRead: false,
      relatedEvent: event2._id,
    },
  ];

  await Notification.insertMany(notifications);
  console.log(`✓ ${notifications.length} notifications created`);

  // ── Done ─────────────────────────────────────────────────────────────────
  console.log('\n✓ Seed complete\n');
  console.log('  Seed credentials:');
  console.log('  Head:    head@cmes.edu            / Head@2024!');
  console.log('  Faculty: faculty.et@cmes.edu       / Faculty@2024!');
  console.log('  Student: ET2024001@student.cmes.edu / Student@2024!');
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
