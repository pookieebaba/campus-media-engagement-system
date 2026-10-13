import React from 'react';
import { Badge } from '../ui/Badge.jsx';

const LABELS = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  excused: 'Excused',
};

export function AttendanceStatusBadge({ status }) {
  return (
    <Badge variant={status ?? 'absent'}>
      {LABELS[status] ?? status ?? 'Unknown'}
    </Badge>
  );
}

export default AttendanceStatusBadge;
