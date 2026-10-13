import React from 'react';
import { Badge } from '../ui/Badge.jsx';

const LABELS = {
  draft: 'Draft',
  published: 'Published',
  ongoing: 'Ongoing',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export function EventStatusBadge({ status }) {
  return (
    <Badge variant={status ?? 'draft'}>
      {LABELS[status] ?? status ?? 'Unknown'}
    </Badge>
  );
}

export default EventStatusBadge;
