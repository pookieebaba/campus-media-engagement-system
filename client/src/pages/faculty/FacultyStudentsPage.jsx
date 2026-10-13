import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Avatar } from '../../components/ui/Avatar.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { BlockBadge } from '../../components/shared/BlockBadge.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { listEvents } from '../../api/event.api.js';
import { formatStudentId } from '../../utils/formatters.js';

export function FacultyStudentsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [supervisedEvents, setSupervisedEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    document.title = 'My Students | CMES';
  }, []);

  useEffect(() => {
    if (!user) return;
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const res = await listEvents({ limit: 100 });
        const allEvents = res.data?.events ?? res.data ?? [];
        const supervised = allEvents.filter((ev) =>
          Array.isArray(ev.supervisors) &&
          ev.supervisors.some((s) => (s._id ?? s) === user._id)
        );
        setSupervisedEvents(supervised);

        // Collect unique students from assignedStudents
        const studentMap = new Map();
        supervised.forEach((ev) => {
          (ev.assignedStudents ?? []).forEach((s) => {
            if (s && s._id) {
              studentMap.set(String(s._id), s);
            }
          });
        });

        setStudents(Array.from(studentMap.values()));
      } catch (err) {
        setError(err?.response?.data?.message ?? 'Failed to load student data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const filteredStudents = students.filter(
    (s) =>
      !search ||
      (s.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (s.studentId ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const columns = [
    { key: 'studentId', label: 'Student ID', render: (_, row) => formatStudentId(row.studentId) },
    { key: 'name', label: 'Name', render: (_, row) => <span className="font-semibold">{row.name}</span> },
    {
      key: 'block',
      label: 'Block',
      render: (_, row) => <BlockBadge block={row.block} />,
    },
    { key: 'email', label: 'Email', render: (_, row) => <span className="text-foreground/60">{row.email ?? '—'}</span> },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <button
          type="button"
          className="text-xs text-moss hover:underline font-body font-semibold"
          onClick={() => setSelectedStudent(row)}
        >
          View
        </button>
      ),
    },
  ];

  if (loading) return <AppShell title="My Students"><LoadingSpinner size="lg" /></AppShell>;
  if (error) return <AppShell title="My Students"><Card className="text-destructive font-body">{error}</Card></AppShell>;

  const studentEvents = selectedStudent
    ? supervisedEvents.filter((ev) =>
        (ev.assignedStudents ?? []).some((s) => (s._id ?? s) === selectedStudent._id)
      )
    : [];

  return (
    <AppShell title="My Students">
      <div className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Search by name or student ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs px-3 py-2 text-sm font-body text-foreground bg-background border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-moss"
          aria-label="Search students"
        />

        {filteredStudents.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students found"
            description="No students are assigned to your supervised events."
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredStudents}
            emptyTitle="No students found"
          />
        )}
      </div>

      {/* Student profile modal */}
      <Modal
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title="Student Profile"
        size="md"
      >
        {selectedStudent && (
          <div className="flex flex-col gap-4 font-body">
            <div className="flex items-center gap-4">
              <Avatar name={selectedStudent.name} size="lg" />
              <div>
                <p className="font-heading text-xl font-semibold text-foreground">{selectedStudent.name}</p>
                <p className="text-sm text-foreground/60">{selectedStudent.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-foreground/60">Student ID</p>
                <p className="font-semibold">{formatStudentId(selectedStudent.studentId)}</p>
              </div>
              <div>
                <p className="text-foreground/60">Block</p>
                <BlockBadge block={selectedStudent.block} />
              </div>
            </div>
            {studentEvents.length > 0 && (
              <div>
                <p className="font-semibold text-sm text-foreground mb-2">Upcoming Events</p>
                <ul className="flex flex-col gap-1">
                  {studentEvents.slice(0, 5).map((ev) => (
                    <li key={ev._id} className="text-sm text-foreground/80">{ev.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppShell>
  );
}

export default FacultyStudentsPage;
