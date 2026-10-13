import React from 'react';
import { Badge } from '../ui/Badge.jsx';

export function BlockBadge({ block }) {
  const name = typeof block === 'object' ? (block?.code ?? block?.name) : block;
  return <Badge variant="default">{name ?? '—'}</Badge>;
}

export default BlockBadge;
