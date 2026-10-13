import React from 'react';
import { Badge } from '../ui/Badge.jsx';

const LABELS = {
  going: 'Going',
  not_going: 'Not Going',
  pending: 'Pending',
};

export function RsvpStatusBadge({ status }) {
  return (
    <Badge variant={status ?? 'pending'}>
      {LABELS[status] ?? status ?? 'Pending'}
    </Badge>
  );
}

export default RsvpStatusBadge;
