import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { notificationAPI } from '../../api';
import { getErrorMessage, timeAgo } from '../../utils/helpers';
import { Button, Badge } from '../ui';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [dropOpen, setDropOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const isHome = location.pathname === '/';
  const role = user?.role || 'student';

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setDropOpen(false);
    setNotifOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return null;
    if (user.role === 'admin') return '/admin';
    if (user.role === 'tutor') return '/tutor/dashboard';
    return '/student/dashboard';
  };

  // Admin only has the single /admin dashboard; other roles get dedicated pages.
  const getRoleLink = (segment) => {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    return `/${user.role || role}/${segment}`;
  };

  const navLinks = [
    { label: 'Find Tutors', to: '/tutors' },
    { label: 'Post Tuition', to: user?.role === 'student' || !user ? '/post-tuition' : null },
    { label: 'Become a Tutor', to: !user ? '/register?role=tutor' : null },
  ].filter((l) => l.to);

  // ----- Notifications -----
  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationAPI.get({ limit: 5 });
      const payload = res?.data || {};
      const list = Array.isArray(payload)
        ? payload
        : payload.notifications || payload.data || [];
      const safeList = Array.isArray(list) ? list.slice(0, 5) : [];
      setNotifications(safeList);
      const unread =
        typeof payload.unreadCount === 'number'
          ? payload.unreadCount
          : safeList.filter((n) => !n.read && !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      // Fail silently — notifications are a convenience, not a blocking feature.
      getErrorMessage(err, 'Could not load notifications.');
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setNotifOpen(false);
      return undefined;
    }

    fetchNotifications();
    const timer = setInterval(fetchNotifications, 30000);
    return () => clearInterval(timer);
  }, [user?._id, fetchNotifications]);

  const handleNotificationClick = async (notification) => {
    const target = notification?.data?.path || notification?.path || getDashboardLink();
    setNotifOpen(false);

    try {
      await notificationAPI.markRead(notification._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      getErrorMessage(err, 'Could not mark notification as read.');
    } finally {
      navigate(target || '/');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      getErrorMessage(err, 'Could not mark notifications as read.');
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[1000] backdrop-blur-md transition-all duration-300 ${
        isHome && !scrolled ? 'bg-[#FDFBF7]/85 border-b border-transparent' : 'bg-[#FDFBF7]/[0.97] border-b border-gray-200'
      }`}
    >
      <div className="container max-w-[1200px] mx-auto px-6 flex items-center justify-between h-[68px]">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-br from-royal to-violet flex items-center justify-center text-lg">🎓</div>
          <span className="font-sora font-bold text-lg text-gray-900">
            Tuition<span className="text-royal">Finder</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`text-sm font-medium no-underline transition-colors hover:text-royal ${
                location.pathname === n.to ? 'text-royal' : 'text-gray-500'
              }`}
            >
              {n.label}
            </Link>
          ))}
        </div>

        {/* Right side (desktop) */}
        <div className="hidden md:flex items-center gap-2.5">
          {user ? (
            <>
              {/* Notification bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    setNotifOpen((v) => !v);
                    setDropOpen(false);
                  }}
                  aria-label="Notifications"
                  className="relative w-9 h-9 flex items-center justify-center bg-white border-[1.5px] border-gray-200 rounded-xl text-lg cursor-pointer transition-colors hover:border-royal"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <>
                    <div className="fixed inset-0 z-[998]" onClick={() => setNotifOpen(false)} />
                    <div className="absolute top-[calc(100%+8px)] right-0 w-[320px] bg-white border border-gray-200 rounded-2xl shadow-xl z-[999] overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <span className="text-sm font-bold text-gray-900 font-sora">Notifications</span>
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="bg-transparent border-none cursor-pointer text-xs font-semibold text-royal hover:underline"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-[320px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="px-4 py-5 text-center text-[13px] text-gray-400">
                            No notifications yet
                          </p>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n._id}
                              type="button"
                              onClick={() => handleNotificationClick(n)}
                              className={`block w-full text-left px-4 py-3 bg-transparent border-none border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
                                n.read || n.isRead ? 'text-gray-500' : 'bg-blue-50/40'
                              }`}
                            >
                              <div className="text-[13px] font-semibold text-gray-800 font-sora">
                                {n.title || n.message || 'Notification'}
                              </div>
                              {n.title && n.message && (
                                <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</div>
                              )}
                              <div className="text-[11px] text-gray-400 mt-1">
                                {timeAgo(n.createdAt || n.created_at)}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                      <div className="px-4 py-2.5 border-t border-gray-100 text-center">
                        <Link
                          to={getDashboardLink()}
                          onClick={() => setNotifOpen(false)}
                          className="text-xs font-semibold text-royal no-underline"
                        >
                          View dashboard →
                        </Link>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => {
                    setDropOpen(!dropOpen);
                    setNotifOpen(false);
                  }}
                  className="flex items-center gap-2.5 bg-white border-[1.5px] border-gray-200 rounded-xl px-3.5 py-1.5 cursor-pointer transition-colors hover:border-royal"
                >
                  <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-royal to-violet flex items-center justify-center text-white text-xs font-bold font-sora">
                    {(user.name || 'U').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-gray-900 font-sora">{user.name?.split(' ')[0]}</span>
                  <span className="text-[10px] text-gray-400">▼</span>
                </button>

                {dropOpen && (
                  <>
                    <div onClick={() => setDropOpen(false)} className="fixed inset-0 z-[998]" />
                    <div className="absolute top-[calc(100%+8px)] right-0 bg-white border border-gray-200 rounded-2xl shadow-xl min-w-[200px] z-[999] py-2 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="text-sm font-bold text-gray-900 font-sora">{user.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{user.email}</div>
                        <Badge variant="blue" className="mt-1.5">
                          {user.role === 'student' ? '👨‍🎓 Student' : user.role === 'tutor' ? '👨‍🏫 Tutor' : '⚙️ Admin'}
                        </Badge>
                      </div>
                      {[
                        { label: '📊 Dashboard', to: getDashboardLink() },
                        { label: '👤 My Profile', to: getRoleLink('profile') },
                        { label: '💬 Messages', to: getRoleLink('messages') },
                      ].map((item) => (
                        <Link
                          key={item.label}
                          to={item.to}
                          onClick={() => setDropOpen(false)}
                          className="block px-4 py-2.5 text-sm text-gray-800 no-underline hover:bg-gray-50 transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                      <div className="border-t border-gray-100 my-2" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2.5 text-sm text-red-600 bg-transparent border-none cursor-pointer hover:bg-red-50 transition-colors"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="no-underline">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
              <Link to="/register" className="no-underline">
                <Button variant="primary" size="sm">Register Free</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button onClick={() => setOpen(!open)} className="md:hidden bg-transparent border-none cursor-pointer text-2xl text-gray-900">
          {open ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="bg-white border-t border-gray-200 px-4 pt-3 pb-5">
          {navLinks.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className="block px-3.5 py-3 text-[15px] font-medium text-gray-900 no-underline rounded-[10px] mb-1 hover:bg-gray-50"
            >
              {n.label}
            </Link>
          ))}
          {user && (
            <>
              <Link
                to={getRoleLink('profile')}
                onClick={() => setOpen(false)}
                className="block px-3.5 py-3 text-[15px] font-medium text-gray-900 no-underline rounded-[10px] mb-1 hover:bg-gray-50"
              >
                👤 My Profile
              </Link>
              <Link
                to={getRoleLink('messages')}
                onClick={() => setOpen(false)}
                className="block px-3.5 py-3 text-[15px] font-medium text-gray-900 no-underline rounded-[10px] mb-1 hover:bg-gray-50"
              >
                💬 Messages
              </Link>
            </>
          )}
          <div className="flex gap-2.5 mt-3 pt-3 border-t border-gray-200">
            {user ? (
              <>
                <Link to={getDashboardLink()} onClick={() => setOpen(false)} className="flex-1 no-underline">
                  <Button variant="secondary" size="sm" className="w-full">Dashboard</Button>
                </Link>
                <Button onClick={handleLogout} variant="danger" size="sm" className="flex-1">Logout</Button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={() => setOpen(false)} className="flex-1 no-underline">
                  <Button variant="outline" size="sm" className="w-full">Login</Button>
                </Link>
                <Link to="/register" onClick={() => setOpen(false)} className="flex-1 no-underline">
                  <Button variant="primary" size="sm" className="w-full">Register</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
