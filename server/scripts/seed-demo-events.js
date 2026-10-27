require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const mongoose = require('mongoose');

const User = require('../models/User');
const Block = require('../models/Block');
const Event = require('../models/Event');
const EventParticipation = require('../models/EventParticipation');
const Attendance = require('../models/Attendance');

/**
 * Additive demo seeder.
 *
 * Creates five "full-day" PUBLISHED events on Oct 26, 27, 28, 29, 30 (2026)
 * so the QR attendance flow can be demonstrated live during evaluation.
 *
 * It does NOT wipe the base seed (users/blocks/etc.). It only touches events
 * whose title starts with DEMO_TITLE_PREFIX, so it is safe to re-run.
 *
 * Why these settings make the QR demo work:
 *  - status: 'published'  -> students can see the event + check in (backend
 *    allows check-in for any non-completed/cancelled event; the student UI
 *    only shows the check-in form for 'published'/'ongoing' events).
 *  - assignedStudents: ALL students -> any seeded student can check in.
 *  - supervisors: ALL faculty -> any faculty can open the QR page + generate.
 *  - checkInWindow: {00:00 .. 23:59} on the event day -> check-in is open the
 *    entire day, regardless of when during the day the evaluation happens.
 *  - endTime '23:00' -> the QR token (which expires 30 min after event end)
 *    stays valid until 23:30, so a single "Generate QR" in the morning works
 *    for the whole day.
 */

const DEMO_TITLE_PREFIX = 'Demo: Full-Day Media Showcase - Oct';

const demoDays = [
  { day: 26, venue: 'Main Auditorium, Block A' },
  { day: 27, venue: 'Studio Lab, FD Block' },
  { day: 28, venue: 'Lecture Hall 3, MT Block' },
  { day: 29, venue: 'Conference Room, ET Block' },
  { day: 30, venue: 'Seminar Hall, Pharmacy Block' },
];

// Build a Date for 2026-10-<day> at the given local time (HH:MM).
function at(day, hh, mm) {
  const pad = (n) => String(n).padStart(2, '0');
  // ISO date-time WITHOUT timezone offset -> interpreted as local time.
  return new Date(`2026-10-${pad(day)}T${pad(hh)}:${pad(mm)}:00`);
}

async function seedDemo() {
  console.log('🌱 Seeding demo events (Oct 26-30, 2026)...');

  if (!process.env.MONGO_URI) {
    console.error('❌ MONGO_URI is not set. Check server/.env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('✓ Connected to MongoDB');

  // ── Locate base seed data ────────────────────────────────────────────────
  const head = await User.findOne({ role: 'head' });
  const faculty = await User.find({ role: 'faculty' });
  const students = await User.find({ role: 'student' });
  const blocks = await Block.find();

  if (!students.length || !blocks.length) {
    console.error(
      '❌ No students/blocks found. Run the base seed first:  npm run seed'
    );
    await mongoose.disconnect();
    process.exit(1);
  }

  const organizerId = head ? head._id : faculty[0]?._id;
  if (!organizerId) {
    console.error('❌ No head or faculty user found. Run the base seed first:  npm run seed');
    await mongoose.disconnect();
    process.exit(1);
  }

  const supervisorIds = faculty.map((f) => f._id);
  const blockIds = blocks.map((b) => b._id);
  const studentIds = students.map((s) => s._id);

  // ── Clean up any previous run of this script (idempotent) ────────────────
  const oldDemoEvents = await Event.find({ title: { $regex: `^${DEMO_TITLE_PREFIX}` } });
  if (oldDemoEvents.length) {
    const oldIds = oldDemoEvents.map((e) => e._id);
    await Promise.all([
      EventParticipation.deleteMany({ event: { $in: oldIds } }),
      Attendance.deleteMany({ event: { $in: oldIds } }),
      Event.deleteMany({ _id: { $in: oldIds } }),
    ]);
    console.log(`✓ Removed ${oldDemoEvents.length} previous demo events`);
  }

  // ── Create the five full-day demo events ──────────────────────────────────
  const createdEvents = [];
  for (const d of demoDays) {
    const dateStart = at(d.day, 9, 0);
    const winStart = at(d.day, 0, 0);
    const winEnd = at(d.day, 23, 59);
    const rsvpDeadline = new Date(dateStart.getTime() - 24 * 60 * 60 * 1000); // 1 day before

    const ev = await Event.create({
      title: `${DEMO_TITLE_PREFIX} ${d.day}`,
      description:
        'Full-day campus media engagement showcase for the evaluation demo. ' +
        `Open the event from the faculty/head dashboard and click "Show QR" / ` +
        '"Generate QR", then have an assigned student check in with that token.',
      date: dateStart,
      startTime: '09:00',
      endTime: '23:00',
      venue: d.venue,
      status: 'published',
      organizer: organizerId,
      supervisors: supervisorIds,
      participatingBlocks: blockIds,
      assignedStudents: studentIds,
      rsvpDeadline,
      checkInWindow: { start: winStart, end: winEnd },
    });

    createdEvents.push(ev);
    console.log(`✓ Created: ${ev.title}  (${d.venue})`);
  }

  // ── RSVP all students as "going" for each demo event ──────────────────────
  // (Not strictly required for check-in, but makes the roster look complete.)
  const participationDocs = [];
  for (const ev of createdEvents) {
    for (const sid of studentIds) {
      participationDocs.push({
        event: ev._id,
        student: sid,
        rsvpStatus: 'going',
        rsvpAt: new Date(),
      });
    }
  }
  try {
    await EventParticipation.insertMany(participationDocs, { ordered: false });
  } catch (e) {
    // Ignore duplicate-key errors from a partial prior run
    if (e.code !== 11000 && !(e.writeErrors || []).some((we) => we.code === 11000)) {
      throw e;
    }
  }
  console.log(`✓ ${participationDocs.length} participation records (rsvp = going)`);

  // ── Done ─────────────────────────────────────────────────────────────────
  console.log('\n✓ Demo seed complete\n');
  console.log('  Events (full day, 09:00-23:00):');
  createdEvents.forEach((ev) => {
    console.log(`   • ${ev.title}  @ ${ev.venue}  [check-in open ${at(Number(ev.title.split(' ').pop()), 0, 0).toLocaleString()} .. 23:59]`);
  });
  console.log('');
  console.log('  Demo flow:');
  console.log('    1. Log in as faculty/head (faculty.et@cmes.edu / Faculty@2024!)');
  console.log('       or head (head@cmes.edu / Head@2024!)');
  console.log('    2. Open the demo event → "Show QR" → QR is generated (valid until 23:30).');
  console.log('    3. Log in as a student (ET2024001@student.cmes.edu / Student@2024!)');
  console.log('       in another browser/profile.');
  console.log('    4. Open the event → Check In → paste the QR token → Check In.');
  console.log('       (Scan the QR with a phone QR app to read the token, or copy the');
  console.log('        token text if your UI shows it.)');
  console.log('    5. Back on the faculty QR page, the student appears under');
  console.log('       "Recent QR Check-ins" (auto-refreshes every 10s).');
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
}

seedDemo().catch((err) => {
  console.error('❌ Demo seed failed:', err);
  process.exit(1);
});
