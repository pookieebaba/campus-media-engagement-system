import React, { useEffect, useState } from 'react';
import { SearchInput } from '../ui/SearchInput.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { listUsers } from '../../api/user.api.js';

export function EventParticipantSelector({
  value = [],
  onChange,
  role,
  label,
  filterBlockIds,
}) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!role) return;
    listUsers({ role })
      .then((res) => setUsers(res.data?.users ?? res.data ?? []))
      .catch(() => {});
  }, [role]);

  const filtered = users.filter((u) => {
    if (filterBlockIds && filterBlockIds.length > 0) {
      const blockId = typeof u.block === 'object' ? u.block?._id : u.block;
      if (!filterBlockIds.includes(blockId)) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return (
        u.name?.toLowerCase().includes(q) ||
        u.studentId?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  function toggle(id) {
    const next = value.includes(id)
      ? value.filter((v) => v !== id)
      : [...value, id];
    onChange?.(next);
  }

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <p className="text-sm font-semibold text-foreground font-body">{label}</p>
      )}
      <div className="border border-border rounded-2xl p-3 bg-background">
        {value.length > 0 && (
          <p className="text-xs font-body text-moss mb-2 font-semibold">
            {value.length} selected
          </p>
        )}
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          placeholder={`Search ${role}s…`}
          className="mb-2"
        />
        <div className="max-h-48 overflow-y-auto flex flex-col gap-1">
          {filtered.length === 0 && (
            <p className="text-xs text-foreground/40 font-body text-center py-2">No results</p>
          )}
          {filtered.map((u) => (
            <label
              key={u._id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-stone cursor-pointer"
            >
              <input
                type="checkbox"
                checked={value.includes(u._id)}
                onChange={() => toggle(u._id)}
                className="accent-moss w-4 h-4 shrink-0"
              />
              <Avatar name={u.name} size="sm" />
              <span className="text-sm font-body text-foreground flex-1 truncate">{u.name}</span>
              {u.studentId && (
                <span className="text-xs text-foreground/40 font-body">{u.studentId}</span>
              )}
              {u.block?.code && (
                <span className="text-xs text-foreground/40 font-body">{u.block.code}</span>
              )}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EventParticipantSelector;
