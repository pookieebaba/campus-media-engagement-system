import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Users, BookOpen, Building2,
  BarChart2, ClipboardList, Bell, Settings,
  GraduationCap, CheckSquare, Megaphone, UserCircle,
  LogOut, Leaf,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { Avatar } from '../ui/Avatar.jsx';
import { Badge } from '../ui/Badge.jsx';

const NAV = {
  head: [
    { to: '/head/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/head/events', icon: Calendar, label: 'Events' },
    { to: '/head/students', icon: GraduationCap, label: 'Students' },
    { to: '/head/faculty', icon: Users, label: 'Faculty' },
    { to: '/head/blocks', icon: Building2, label: 'Blocks' },
    { to: '/head/reports', icon: BarChart2, label: 'Reports' },
    { to: '/head/audit-logs', icon: ClipboardList, label: 'Audit Logs' },
    { to: '/head/notifications', icon: Bell, label: 'Notifications' },
    { to: '/head/settings', icon: Settings, label: 'Settings' },
  ],
  faculty: [
    { to: '/faculty/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/faculty/events', icon: Calendar, label: 'My Events' },
    { to: '/faculty/students', icon: Users, label: 'My Students' },
    { to: '/faculty/announcements', icon: Megaphone, label: 'Announcements' },
    { to: '/faculty/notifications', icon: Bell, label: 'Notifications' },
  ],
  student: [
    { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/student/events', icon: Calendar, label: 'Events' },
    { to: '/student/participation', icon: BookOpen, label: 'My Participation' },
    { to: '/student/attendance', icon: CheckSquare, label: 'Attendance History' },
    { to: '/student/notifications', icon: Bell, label: 'Notifications' },
    { to: '/student/profile', icon: UserCircle, label: 'Profile' },
  ],
};

const ROLE_LABELS = { head: 'Head Admin', faculty: 'Faculty', student: 'Student' };

export function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const navItems = NAV[user?.role] ?? [];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside className="flex flex-col h-full bg-background border-r border-border w-64">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-border">
        <div className="w-8 h-8 rounded-full bg-moss flex items-center justify-center shrink-0">
          <Leaf size={16} className="text-white" aria-hidden="true" />
        </div>
        <span className="font-heading text-lg font-semibold text-foreground">CMES</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        <ul className="flex flex-col gap-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to.endsWith('dashboard')}
                onClick={onClose}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold font-body transition-colors',
                    isActive
                      ? 'bg-moss text-white shadow-sm'
                      : 'text-foreground/70 hover:bg-stone hover:text-foreground',
                  ].join(' ')
                }
              >
                <Icon size={18} aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User info + logout */}
      <div className="px-3 py-4 border-t border-border space-y-2">
        <div className="flex items-center gap-3 px-2">
          <Avatar name={user?.name ?? ''} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate font-body">
              {user?.name}
            </p>
            <Badge variant={user?.role ?? 'default'} className="mt-0.5">
              {ROLE_LABELS[user?.role] ?? user?.role}
            </Badge>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold font-body text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
        >
          <LogOut size={18} aria-hidden="true" />
          Logout
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
