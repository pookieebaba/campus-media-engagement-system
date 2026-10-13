import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  GraduationCap,
  Building2,
  CalendarDays,
  UserCheck,
  ClipboardCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { EventStatusBadge } from '../../components/shared/EventStatusBadge.jsx';
import { listUsers } from '../../api/user.api.js';
import { listEvents } from '../../api/event.api.js';
import { listBlocks } from '../../api/block.api.js';
import { attendanceReport, participationReport } from '../../api/report.api.js';
import { formatDate } from '../../utils/formatters.js';

export function HeadDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    blocks: 0,
    upcomingEvents: [],
    confirmedParticipants: 0,
    actualAttendees: 0,
    needsReview: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [attendanceExceptions, setAttendanceExceptions] = useState([]);

  useEffect(() => {
    document.title = 'Dashboard | CMES';

    async function fetchAll() {
      try {
        const [studentsRes, facultyRes, blocksRes, eventsRes, partRes, attRes] =
          await Promise.all([
            listUsers({ role: 'student', isActive: true }),
            listUsers({ role: 'faculty', isActive: true }),
            listBlocks(),
            listEvents({ status: 'published,ongoing', limit: 5, sort: '-date' }),
            participationReport(),
            attendanceReport(),
          ]);

        const students = studentsRes.data?.users ?? studentsRes.data ?? [];
        const faculty = facultyRes.data?.users ?? facultyRes.data ?? [];
        const blocks = blocksRes.data?.blocks ?? blocksRes.data ?? [];
        const events = eventsRes.data?.events ?? eventsRes.data ?? [];
        const partData = partRes.data?.data ?? partRes.data ?? [];
        const attData = attRes.data?.data ?? attRes.data ?? [];

        // Participation stats
        const confirmedParticipants = Array.isArray(partData)
          ? partData.filter((r) => r.rsvpStatus === 'going').length
          : 0;

        // Attendance stats
        const actualAttendees = Array.isArray(attData)
          ? attData.filter((r) => r.status === 'present' || r.status === 'late').length
          : 0;

        // Attendance needing review: group by event and compare expected vs actual
        const eventAttMap = {};
        if (Array.isArray(attData)) {
          attData.forEach((r) => {
            const eid = r.event?._id ?? r.event ?? 'unknown';
            if (!eventAttMap[eid]) {
              eventAttMap[eid] = {
                eventTitle: r.event?.title ?? eid,
                blockName: r.student?.block?.name ?? '—',
                expected: 0,
                actual: 0,
              };
            }
            eventAttMap[eid].expected += 1;
            if (r.status === 'present' || r.status === 'late') {
              eventAttMap[eid].actual += 1;
            }
          });
        }

        const exceptions = Object.values(eventAttMap).filter(
          (e) => e.expected - e.actual > 0
        );

        const needsReview = exceptions.length;

        // Chart data — group participation by block
        const blockMap = {};
        if (Array.isArray(partData)) {
          partData.forEach((r) => {
            const blockName = r.student?.block?.code ?? r.student?.block?.name ?? 'Unknown';
            if (!blockMap[blockName]) blockMap[blockName] = { block: blockName, Going: 0, Attended: 0 };
            if (r.rsvpStatus === 'going') blockMap[blockName].Going += 1;
          });
        }
        if (Array.isArray(attData)) {
          attData.forEach((r) => {
            const blockName = r.student?.block?.code ?? r.student?.block?.name ?? 'Unknown';
            if (!blockMap[blockName]) blockMap[blockName] = { block: blockName, Going: 0, Attended: 0 };
            if (r.status === 'present' || r.status === 'late') blockMap[blockName].Attended += 1;
          });
        }

        setStats({
          students: Array.isArray(students) ? students.length : (students?.total ?? 0),
          faculty: Array.isArray(faculty) ? faculty.length : (faculty?.total ?? 0),
          blocks: Array.isArray(blocks) ? blocks.length : (blocks?.total ?? 0),
          upcomingEvents: Array.isArray(events) ? events : [],
          confirmedParticipants,
          actualAttendees,
          needsReview,
        });
        setChartData(Object.values(blockMap));
        setAttendanceExceptions(exceptions);
      } catch (err) {
        setError(err?.response?.data?.message ?? 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  const exceptionColumns = [
    { key: 'eventTitle', label: 'Event' },
    { key: 'blockName', label: 'Block' },
    {
      key: 'expected',
      label: 'Expected',
      render: (v) => <span className="font-semibold">{v}</span>,
    },
    {
      key: 'actual',
      label: 'Actual',
      render: (v) => <span className="font-semibold">{v}</span>,
    },
    {
      key: 'gap',
      label: 'Gap',
      render: (_, row) => (
        <span className="text-destructive font-semibold">{row.expected - row.actual}</span>
      ),
    },
  ];

  return (
    <AppShell title="Dashboard">
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <Card>
          <p className="font-body text-destructive text-sm">{error}</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Users} label="Active Students" value={stats.students} />
            <StatCard icon={GraduationCap} label="Faculty Count" value={stats.faculty} />
            <StatCard icon={Building2} label="Block Count" value={stats.blocks} />
            <StatCard icon={CalendarDays} label="Upcoming Events" value={stats.upcomingEvents.length} />
            <StatCard icon={UserCheck} label="Confirmed Participants" value={stats.confirmedParticipants} />
            <StatCard icon={ClipboardCheck} label="Actual Attendees" value={stats.actualAttendees} />
            <StatCard icon={AlertTriangle} label="Attendance Needing Review" value={stats.needsReview} />
          </div>

          {/* Chart + Recent Events */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Block Participation Chart */}
            <Card className="flex-1">
              <h2 className="font-heading text-lg font-semibold text-foreground mb-4">
                Block Participation
              </h2>
              {chartData.length === 0 ? (
                <p className="text-sm font-body text-foreground/40 text-center py-8">
                  No participation data yet
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <XAxis dataKey="block" tick={{ fontSize: 12, fontFamily: 'Nunito' }} />
                    <YAxis tick={{ fontSize: 12, fontFamily: 'Nunito' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Going" fill="#5D7052" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Attended" fill="#C18C5D" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Recent Events */}
            <Card className="flex-1 lg:max-w-sm">
              <h2 className="font-heading text-lg font-semibold text-foreground mb-4">
                Recent Events
              </h2>
              {stats.upcomingEvents.length === 0 ? (
                <p className="text-sm font-body text-foreground/40">No recent events</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {stats.upcomingEvents.map((ev) => (
                    <li key={ev._id}>
                      <Link
                        to={`/head/events/${ev._id}`}
                        className="flex items-center gap-3 hover:bg-stone/50 p-3 rounded-xl transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold font-body text-foreground truncate">
                            {ev.title}
                          </p>
                          <p className="text-xs font-body text-foreground/40">{formatDate(ev.date)}</p>
                        </div>
                        <EventStatusBadge status={ev.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Attendance Exceptions */}
          {attendanceExceptions.length > 0 && (
            <div>
              <h2 className="font-heading text-lg font-semibold text-foreground mb-3">
                Attendance Exceptions
              </h2>
              <DataTable
                columns={exceptionColumns}
                data={attendanceExceptions}
                emptyTitle="No attendance exceptions"
              />
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}

export default HeadDashboardPage;
