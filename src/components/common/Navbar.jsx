import { Icon } from "../ui/Icon";
import { useState, useEffect, useCallback, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { notificationAPI } from "../../api";
import { getErrorMessage, timeAgo } from "../../utils/helpers";
import { Button, Badge, Skeleton } from "../ui";

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
  const [notifLoading, setNotifLoading] = useState(false);
  const notifLoadedRef = useRef(false);

  const isHome = location.pathname === "/";
  const role = user?.role || "student";

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setDropOpen(false);
    setNotifOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return null;
    if (user.role === "admin") return "/admin";
    if (user.role === "tutor") return "/tutor/dashboard";
    return "/student/dashboard";
  };

  // Admin only has the single /admin dashboard; other roles get dedicated pages.
  const getRoleLink = (segment) => {
    if (!user) return "/login";
    if (user.role === "admin") return "/admin";
    return `/${user.role || role}/${segment}`;
  };

  // Keep the primary nav useful after login. The old filter dropped every
  // role-specific link, so tutors/admins were left with "Find Tutors" only.
  const navLinks = [
    { label: "Find Tutors", to: "/tutors" },
    ...(!user || user.role === "student"
      ? [{ label: "Post Tuition", to: "/post-tuition" }]
      : []),
    ...(user?.role === "tutor"
      ? [{ label: "Find Jobs", to: "/tutors/jobs" }]
      : []),
    ...(user ? [{ label: "Dashboard", to: getDashboardLink() }] : []),
    ...(!user ? [{ label: "Become a Tutor", to: "/register?role=tutor" }] : []),
  ];

  const isActiveLink = (to) =>
    location.pathname === to ||
    (to === "/tutors" &&
      /^\/tutors\/[^/]+$/.test(location.pathname) &&
      location.pathname !== "/tutors/jobs");

  // ----- Notifications -----
  const fetchNotifications = useCallback(async () => {
    // Only the first fetch shows a skeleton; the 30s refresh must not flash it.
    if (!notifLoadedRef.current) setNotifLoading(true);
    try {
      const res = await notificationAPI.get({ limit: 5 });
      const payload = res?.data || {};
      const list = Array.isArray(payload)
        ? payload
        : payload.notifications || payload.data || [];
      const safeList = Array.isArray(list) ? list.slice(0, 5) : [];
      setNotifications(safeList);
      const unread =
        typeof payload.unreadCount === "number"
          ? payload.unreadCount
          : safeList.filter((n) => !n.read && !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      // Fail silently — notifications are a convenience, not a blocking feature.
      getErrorMessage(err, "Could not load notifications.");
    } finally {
      notifLoadedRef.current = true;
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setNotifOpen(false);
      setNotifLoading(false);
      notifLoadedRef.current = false;
      return undefined;
    }

    fetchNotifications();
    const timer = setInterval(fetchNotifications, 30000);
    return () => clearInterval(timer);
  }, [user?._id, fetchNotifications]);

  const handleNotificationClick = async (notification) => {
    const target =
      notification?.data?.path || notification?.path || getDashboardLink();
    setNotifOpen(false);

    try {
      await notificationAPI.markRead(notification._id);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notification._id ? { ...n, read: true } : n,
        ),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      getErrorMessage(err, "Could not mark notification as read.");
    } finally {
      navigate(target || "/");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      getErrorMessage(err, "Could not mark notifications as read.");
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[1000] backdrop-blur-md transition-all duration-300 ${
        isHome && !scrolled
          ? "bg-canvas/85 border-b border-transparent"
          : "bg-canvas/95 border-b border-line"
      }`}
    >
      <div className="container max-w-[1200px] mx-auto px-6 flex items-center justify-between h-[68px]">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center text-lg text-surface">
            <Icon name="bookOpen" />
          </div>
          <span className="font-sora font-bold text-lg text-ink">
            Tuition<span className="text-brand">Finder</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-7">
          {navLinks.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className={`text-sm font-medium no-underline transition-colors hover:text-brand ${
                isActiveLink(n.to) ? "text-brand" : "text-muted"
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
                  className="relative w-9 h-9 flex items-center justify-center bg-surface border-[1.5px] border-line rounded-xl text-lg cursor-pointer transition-colors hover:border-brand"
                >
                  <Icon name="bell" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-surface text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-[998]"
                      onClick={() => setNotifOpen(false)}
                    />
                    <div className="popover-panel absolute top-[calc(100%+8px)] right-0 mr-2 w-[320px] z-[999] overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-line/70">
                        <span className="text-sm font-bold text-ink font-sora">
                          Notifications
                        </span>
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="bg-transparent border-none cursor-pointer text-xs font-semibold text-brand hover:underline"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-[320px] overflow-y-auto">
                        {notifLoading ? (
                          <div
                            className="divide-y divide-line/50"
                            aria-label="Loading notifications"
                          >
                            {[0, 1, 2].map((n) => (
                              <div key={n} className="px-4 py-3 space-y-2">
                                <Skeleton className="h-3.5 w-2/3" />
                                <Skeleton className="h-3 w-full" />
                                <Skeleton className="h-2.5 w-1/4" />
                              </div>
                            ))}
                          </div>
                        ) : notifications.length === 0 ? (
                          <p className="px-4 py-5 text-center text-[13px] text-muted/70">
                            No notifications yet
                          </p>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n._id}
                              type="button"
                              onClick={() => handleNotificationClick(n)}
                              className={`block w-full text-left px-4 py-3 bg-transparent border-none border-b border-line/50 cursor-pointer hover:bg-canvas transition-colors ${
                                n.read || n.isRead
                                  ? "text-muted"
                                  : "bg-brand-soft/40"
                              }`}
                            >
                              <div className="text-[13px] font-semibold text-ink/90 font-sora">
                                {n.title || n.message || "Notification"}
                              </div>
                              {n.title && n.message && (
                                <div className="text-xs text-muted mt-0.5 line-clamp-2">
                                  {n.message}
                                </div>
                              )}
                              <div className="text-[11px] text-muted/70 mt-1">
                                {timeAgo(n.createdAt || n.created_at)}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                      <div className="px-4 py-2.5 border-t border-line/70 text-center">
                        <Link
                          to={getDashboardLink()}
                          onClick={() => setNotifOpen(false)}
                          className="text-xs font-semibold text-brand no-underline"
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
                  className="flex items-center gap-2.5 bg-surface border-[1.5px] border-line rounded-xl px-3.5 py-1.5 cursor-pointer transition-colors hover:border-brand"
                >
                  <div className="w-[30px] h-[30px] rounded-full border-2 border-brand bg-transparent flex items-center justify-center text-brand text-xs font-bold font-sora shrink-0">
                    {(user.name || "U").slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-ink font-sora">
                    {user.name?.split(" ")[0]}
                  </span>
                  <span className="text-[10px] text-muted/70">
                    <Icon name="chevronDown" />
                  </span>
                </button>

                {dropOpen && (
                  <>
                    <div
                      onClick={() => setDropOpen(false)}
                      className="fixed inset-0 z-[998]"
                    />
                    <div className="popover-panel absolute top-[calc(100%+8px)] right-0 mr-2 min-w-[200px] z-[999] py-2 overflow-hidden">
                      <div className="px-4 py-3 border-b border-line/70">
                        <div className="text-sm font-bold text-ink font-sora">
                          {user.name}
                        </div>
                        <div className="text-xs text-muted/70 mt-0.5">
                          {user.email}
                        </div>
                        <Badge variant="blue" className="mt-1.5">
                          {user.role === "student"
                            ? "Student"
                            : user.role === "tutor"
                              ? "Tutor"
                              : "Admin"}
                        </Badge>
                      </div>
                      {[
                        { label: "Dashboard", to: getDashboardLink() },
                        // Admin has no separate profile/messages pages.
                        ...(user.role === "admin"
                          ? []
                          : [
                              {
                                label: "My Profile",
                                to: getRoleLink("profile"),
                              },
                              { label: "Messages", to: getRoleLink("messages") },
                            ]),
                      ].map((item) => (
                        <Link
                          key={item.label}
                          to={item.to}
                          onClick={() => setDropOpen(false)}
                          className="block px-4 py-2.5 text-sm text-ink/90 no-underline hover:bg-canvas transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                      <div className="border-t border-line/70 my-2" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2.5 text-sm text-danger bg-transparent border-none cursor-pointer hover:bg-danger/10 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="no-underline">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link to="/register" className="no-underline">
                <Button variant="primary" size="sm">
                  Register Free
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden bg-transparent border-none cursor-pointer text-2xl text-ink"
        >
          {open ? <Icon name="close" /> : <Icon name="grid" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="bg-surface border-t border-line px-4 pt-3 pb-5">
          {/* Dashboard is rendered as a button below; skip the duplicate link. */}
          {navLinks
            .filter((n) => n.label !== "Dashboard")
            .map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="block px-3.5 py-3 text-[15px] font-medium text-ink no-underline rounded-lg mb-1 hover:bg-canvas"
              >
                {n.label}
              </Link>
            ))}
          {user && user.role !== "admin" && (
            <>
              <Link
                to={getRoleLink("profile")}
                onClick={() => setOpen(false)}
                className="block px-3.5 py-3 text-[15px] font-medium text-ink no-underline rounded-lg mb-1 hover:bg-canvas"
              >
                My Profile
              </Link>
              <Link
                to={getRoleLink("messages")}
                onClick={() => setOpen(false)}
                className="block px-3.5 py-3 text-[15px] font-medium text-ink no-underline rounded-lg mb-1 hover:bg-canvas"
              >
                Messages
              </Link>
            </>
          )}
          <div className="flex gap-2.5 mt-3 pt-3 border-t border-line">
            {user ? (
              <>
                <Link
                  to={getDashboardLink()}
                  onClick={() => setOpen(false)}
                  className="flex-1 no-underline"
                >
                  <Button variant="secondary" size="sm" className="w-full">
                    Dashboard
                  </Button>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="danger"
                  size="sm"
                  className="flex-1"
                >
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="flex-1 no-underline"
                >
                  <Button variant="outline" size="sm" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="flex-1 no-underline"
                >
                  <Button variant="primary" size="sm" className="w-full">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
