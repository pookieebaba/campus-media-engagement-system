import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '../../components/layout/AppShell.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { Textarea } from '../../components/ui/Textarea.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner.jsx';
import { EventParticipantSelector } from '../../components/shared/EventParticipantSelector.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { getEvent, createEvent, updateEvent } from '../../api/event.api.js';
import { listBlocks } from '../../api/block.api.js';

function toDateInputValue(date) {
  if (!date) return '';
  return new Date(date).toISOString().split('T')[0];
}

function toDateTimeLocalValue(date) {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CreateEditEventPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [blocks, setBlocks] = useState([]);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: '',
    description: '',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
    rsvpDeadline: '',
    checkInWindowStart: '',
    checkInWindowEnd: '',
    participatingBlocks: [],
    supervisors: [],
    assignedStudents: [],
  });

  useEffect(() => {
    document.title = isEdit ? 'Edit Event | CMES' : 'Create Event | CMES';
    listBlocks()
      .then((res) => setBlocks(res.data?.blocks ?? res.data ?? []))
      .catch(() => {});

    if (isEdit) {
      getEvent(id)
        .then((res) => {
          const ev = res.data?.event ?? res.data;
          setForm({
            title: ev.title ?? '',
            description: ev.description ?? '',
            date: toDateInputValue(ev.date),
            startTime: ev.startTime ?? '',
            endTime: ev.endTime ?? '',
            venue: ev.venue ?? '',
            rsvpDeadline: toDateTimeLocalValue(ev.rsvpDeadline),
            checkInWindowStart: toDateTimeLocalValue(ev.checkInWindowStart),
            checkInWindowEnd: toDateTimeLocalValue(ev.checkInWindowEnd),
            participatingBlocks: (ev.participatingBlocks ?? []).map((b) =>
              typeof b === 'object' ? b._id : b
            ),
            supervisors: (ev.supervisors ?? []).map((s) =>
              typeof s === 'object' ? s._id : s
            ),
            assignedStudents: (ev.assignedStudents ?? []).map((s) =>
              typeof s === 'object' ? s._id : s
            ),
          });
        })
        .catch(() => toast.error('Failed to load event'))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, toast]);

  function setField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.date) errs.date = 'Date is required';
    if (!form.startTime) errs.startTime = 'Start time is required';
    if (!form.endTime) errs.endTime = 'End time is required';
    if (!form.venue.trim()) errs.venue = 'Venue is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      title: form.title,
      description: form.description,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      venue: form.venue,
      participatingBlocks: form.participatingBlocks,
      supervisors: form.supervisors,
      assignedStudents: form.assignedStudents,
    };
    if (form.rsvpDeadline) payload.rsvpDeadline = form.rsvpDeadline;
    if (form.checkInWindowStart) payload.checkInWindowStart = form.checkInWindowStart;
    if (form.checkInWindowEnd) payload.checkInWindowEnd = form.checkInWindowEnd;

    setSubmitting(true);
    try {
      if (isEdit) {
        await updateEvent(id, payload);
        toast.success('Event updated');
        navigate(`/head/events/${id}`);
      } else {
        const res = await createEvent(payload);
        const newId = res.data?.event?._id ?? res.data?._id;
        toast.success('Event created');
        navigate(`/head/events/${newId}`);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message ?? 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <AppShell title={isEdit ? 'Edit Event' : 'Create Event'}><LoadingSpinner /></AppShell>;

  return (
    <AppShell title={isEdit ? 'Edit Event' : 'Create Event'}>
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex flex-col gap-6">
        <Card>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-4">Event Details</h2>
          <div className="flex flex-col gap-4">
            <Input
              label="Title"
              required
              value={form.title}
              onChange={(e) => setField('title', e.target.value)}
              error={errors.title}
              placeholder="Event title"
            />
            <Textarea
              label="Description"
              rows={4}
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="Event description"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Date"
                type="date"
                required
                value={form.date}
                onChange={(e) => setField('date', e.target.value)}
                error={errors.date}
              />
              <Input
                label="Start Time"
                type="time"
                required
                value={form.startTime}
                onChange={(e) => setField('startTime', e.target.value)}
                error={errors.startTime}
              />
              <Input
                label="End Time"
                type="time"
                required
                value={form.endTime}
                onChange={(e) => setField('endTime', e.target.value)}
                error={errors.endTime}
              />
            </div>
            <Input
              label="Venue"
              required
              value={form.venue}
              onChange={(e) => setField('venue', e.target.value)}
              error={errors.venue}
              placeholder="Event venue"
            />
          </div>
        </Card>

        <Card>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-4">Scheduling</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="RSVP Deadline"
              type="datetime-local"
              value={form.rsvpDeadline}
              onChange={(e) => setField('rsvpDeadline', e.target.value)}
            />
            <div />
            <Input
              label="Check-in Window Start"
              type="datetime-local"
              value={form.checkInWindowStart}
              onChange={(e) => setField('checkInWindowStart', e.target.value)}
            />
            <Input
              label="Check-in Window End"
              type="datetime-local"
              value={form.checkInWindowEnd}
              onChange={(e) => setField('checkInWindowEnd', e.target.value)}
            />
          </div>
        </Card>

        <Card>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-4">Participating Blocks</h2>
          <div className="flex flex-wrap gap-2">
            {blocks.map((b) => (
              <label key={b._id} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border hover:bg-stone cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.participatingBlocks.includes(b._id)}
                  onChange={() => {
                    const next = form.participatingBlocks.includes(b._id)
                      ? form.participatingBlocks.filter((id) => id !== b._id)
                      : [...form.participatingBlocks, b._id];
                    setField('participatingBlocks', next);
                  }}
                  className="accent-moss w-4 h-4"
                />
                <span className="text-sm font-body text-foreground">{b.name} ({b.code})</span>
              </label>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-4">Supervisors</h2>
          <EventParticipantSelector
            role="faculty"
            value={form.supervisors}
            onChange={(val) => setField('supervisors', val)}
            label="Select supervising faculty"
          />
        </Card>

        <Card>
          <h2 className="font-heading text-xl font-semibold text-foreground mb-4">Assigned Students</h2>
          <EventParticipantSelector
            role="student"
            value={form.assignedStudents}
            onChange={(val) => setField('assignedStudents', val)}
            label="Select assigned students"
            filterBlockIds={form.participatingBlocks.length > 0 ? form.participatingBlocks : undefined}
          />
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={submitting}>
            {isEdit ? 'Save Changes' : 'Create Event'}
          </Button>
        </div>
      </form>
    </AppShell>
  );
}

export default CreateEditEventPage;
