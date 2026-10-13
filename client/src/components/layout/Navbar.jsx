import React, { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, Menu, UserCircle, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNotifications } from '../../hooks/useNotifications.js';
import { Avatar } from '../ui/Avatar.jsx';

const NOTIFICATION_ROUTES = {
  head: '/head/notifications',
  faculty: '/faculty/notifications',
  student: '/student/notifications',
};

const PROFILE_ROUTES = {
  head: '/head/settings',
  faculty: '/faculty/students', // faculty has no dedicated profile page
  student: '/student/profile',
};

export function Navbar({ title, onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const notifRoute = NOTIFICATION_ROUTES[user?.role] ?? '/';
  const profileRoute = PROFILE_ROUTES[user?.role] ?? '/';

  return (
    <header className="h-14 flex items-center gap-3 px-4 border-b border-border bg-background shrink-0">
      {/* Mobile hamburger */}
      <button
        type="button"
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-full hover:bg-stone transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss"
        aria-label="Open menu"
      >
        <Menu size={20} className="text-foreground" />
      </button>

      {/* Page title */}
      <h1 className="font-heading text-xl font-semibold text-foreground flex-1 truncate">
        {title}
      </h1>

      {/* Notification bell */}
      <Link
        to={notifRoute}
        className="relative p-2 rounded-full hover:bg-stone transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell size={20} className="text-foreground/70" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] flex items-center justify-center text-[10px] font-bold text-white bg-destructive rounded-full px-0.5"
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Link>

      {/* Avatar dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-stone transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss"
          aria-expanded={dropdownOpen}
          aria-haspopup="menu"
        >
          <Avatar name={user?.name ?? ''} size="sm" />
          <span className="hidden sm:block text-sm font-semibold font-body text-foreground max-w-[8rem] truncate">
            {user?.name}
          </span>
          <ChevronDown size={14} className="text-foreground/40" aria-hidden="true" />
        </button>

        {dropdownOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 w-44 bg-background border border-border rounded-2xl shadow-card py-1 z-20"
          >
            <Link
              to={profileRoute}
              role="menuitem"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-body text-foreground hover:bg-stone transition-colors"
            >
              <UserCircle size={16} aria-hidden="true" />
              Profile
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-body text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut size={16} aria-hidden="true" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
