import React from 'react';
import { Badge } from '../ui/Badge.jsx';

const LABELS = {
  head: 'Head Admin',
  faculty: 'Faculty',
  student: 'Student',
};

export function UserRoleBadge({ role }) {
  return (
    <Badge variant={role ?? 'default'}>
      {LABELS[role] ?? role ?? 'Unknown'}
    </Badge>
  );
}

export default UserRoleBadge;
