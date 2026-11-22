import { Icon } from "../ui/Icon";
import { Link } from "react-router-dom";

function BadgeCount({ count }) {
  if (count === null || count === undefined || count === 0) return null;
  return (
    <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-brand text-surface text-[10px] font-bold flex items-center justify-center">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function DashboardLayout({
  user,
  links,
  activeTab,
  onTabChange,
  title,
  subtitle,
  actions,
  badges = {},
  onLogout,
  children,
}) {
  const navLinks = Array.isArray(links) ? links : [];
  const initials = (user?.name || "U").trim().slice(0, 2).toUpperCase();
  const roleLabel =
    user?.role === "student"
      ? "Student"
      : user?.role === "tutor"
        ? "Tutor"
        : "Admin";

  const countFor = (link) => {
    const value = link.badgeKey ? badges?.[link.badgeKey] : undefined;
    if (typeof value === "number") return value;
    if (Array.isArray(value)) return value.length;
    return null;
  };

  return (
    <div className="min-h-screen flex bg-canvas">
      {/* Fixed desktop sidebar */}
      <aside className="hidden lg:block w-64 border-r border-line/70 bg-surface fixed inset-y-0 left-0 h-screen z-40">
        <div className="flex flex-col h-full">
          <div className="px-5 pt-5 pb-4 border-b border-line/70">
            <Link to="/" className="flex items-center gap-2.5 no-underline">
              <div className="w-[34px] h-[34px] rounded-lg bg-brand flex items-center justify-center text-base text-surface">
                <Icon name="bookOpen" />
              </div>
              <span className="font-sora font-bold text-base text-ink">
                TuitionFinder
              </span>
            </Link>
          </div>

          <div className="px-5 py-4 border-b border-line/70">
            <div className="flex items-center gap-2.5">
              <div className="w-[38px] h-[38px] rounded-full border-2 border-brand bg-transparent flex items-center justify-center text-brand text-sm font-bold font-sora shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-ink font-sora truncate">
                  {user?.name || "Guest"}
                </div>
                <div className="text-[11px] text-muted/70">{roleLabel}</div>
              </div>
            </div>
          </div>

          <nav className="flex-1 py-2.5 overflow-y-auto">
            {navLinks.map((link) => {
              const count = countFor(link);
              if (link.to) {
                return (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="flex items-center gap-3 px-5 py-2.5 text-sm text-muted no-underline hover:bg-canvas"
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                    <BadgeCount count={count} />
                  </Link>
                );
              }
              return (
                <button
                  key={link.tab ?? link.label}
                  type="button"
                  onClick={() => onTabChange?.(link.tab)}
                  className={`flex items-center gap-3 w-full px-5 py-2.5 text-sm text-left ${
                    activeTab === link.tab
                      ? "bg-brand-soft text-brand font-semibold"
                      : "text-muted hover:bg-canvas"
                  }`}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                  <BadgeCount count={count} />
                </button>
              );
            })}
          </nav>

          <div className="px-3 py-4 border-t border-line/70">
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-3 w-full px-2 py-2.5 text-sm text-danger bg-transparent border-none cursor-pointer hover:bg-danger/10 rounded-lg"
            >
              <Icon name="logout" />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 lg:ml-64 min-w-0">
        {/* Mobile scrollable tab bar */}
        <div className="lg:hidden sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-line/70 px-3 py-2">
          <div className="flex gap-2 overflow-x-auto whitespace-nowrap [scrollbar-width:none]">
            {navLinks.map((link) => {
              const count = countFor(link);
              const active = activeTab === link.tab;
              const classes = `flex items-center gap-1.5 px-3.5 py-2 text-[13px] rounded-xl shrink-0 border ${
                active
                  ? "bg-brand-soft text-brand border-brand/20 font-semibold"
                  : "text-muted border-line bg-surface hover:bg-canvas"
              }`;
              if (link.to) {
                return (
                  <Link
                    key={link.label}
                    to={link.to}
                    className={`${classes} no-underline`}
                  >
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                    {count ? (
                      <span className="text-[10px] font-bold">({count})</span>
                    ) : null}
                  </Link>
                );
              }
              return (
                <button
                  key={link.tab ?? link.label}
                  type="button"
                  onClick={() => onTabChange?.(link.tab)}
                  className={classes}
                >
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                  {count ? (
                    <span className="text-[10px] font-bold">({count})</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>

        <main data-reveal className="p-6 md:p-10 bg-canvas min-h-screen">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-ink font-sora">
                {title}
              </h1>
              {subtitle && (
                <p className="text-sm text-muted mt-1">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2.5 flex-wrap">
                {actions}
              </div>
            )}
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}

export { DashboardLayout };
