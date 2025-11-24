import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, BellRing, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "../Company_Dashboard/ui/button";

const roleLabels = {
  student: "Student",
  mentor: "Mentor",
  admin: "Admin",
  company: "Company",
};

const formatTimestamp = (value) => {
  if (!value) return "Just now";
  try {
    return formatDistanceToNow(new Date(value), { addSuffix: true });
  } catch {
    return value;
  }
};

const EmptyState = ({ role }) => (
  <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
    <div className="mb-3 rounded-full bg-slate-100 p-4 dark:bg-slate-900">
      <BellRing className="h-8 w-8 text-secondary" />
    </div>
    <p className="text-base font-medium text-gray-900 dark:text-gray-50">No notifications yet</p>
    <p className="mt-1 max-w-xs text-sm">
      Once the {roleLabels[role] || "team"} activity starts flowing, updates will appear here instantly.
    </p>
  </div>
);

const roleThemes = {
  student: {
    tag: "Student updates",
    accent: "text-emerald-600",
    badge: "bg-emerald-500",
    iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
    gradient: "from-emerald-500/15 via-white to-white",
  },
  mentor: {
    tag: "Mentor updates",
    accent: "text-sky-600",
    badge: "bg-sky-500",
    iconBg: "bg-sky-50 dark:bg-sky-500/10",
    gradient: "from-sky-500/15 via-white to-white",
  },
  admin: {
    tag: "Admin updates",
    accent: "text-violet-600",
    badge: "bg-violet-500",
    iconBg: "bg-violet-50 dark:bg-violet-500/10",
    gradient: "from-violet-500/15 via-white to-white",
  },
  company: {
    tag: "Company updates",
    accent: "text-amber-600",
    badge: "bg-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-500/10",
    gradient: "from-amber-500/15 via-white to-white",
  },
  default: {
    tag: "Latest updates",
    accent: "text-indigo-600",
    badge: "bg-indigo-500",
    iconBg: "bg-indigo-50 dark:bg-indigo-500/10",
    gradient: "from-indigo-500/15 via-white to-white",
  },
};

const NotificationDrawer = ({
  role,
  notifications,
  isOpen,
  onClose,
  onSelectNotification,
  activeNotification,
  isLoading,
  error,
  unreadCount,
  onMarkAllRead,
}) => {
  const hasNotifications = notifications.length > 0;
  const theme = roleThemes[role] || roleThemes.default;

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.aside
            className="fixed inset-y-0 right-0 z-50 w-full rounded-none bg-white text-gray-900 shadow-[0_10px_50px_rgba(15,23,42,0.2)] ring-1 ring-slate-900/5 backdrop-blur-lg dark:bg-slate-950 dark:text-gray-100 sm:max-w-lg lg:max-w-xl xl:max-w-2xl lg:rounded-l-[32px]"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 30 }}
          >
            <div className="flex h-full flex-col">
              <header className={`relative overflow-hidden border-b border-slate-200 px-6 py-5 dark:border-slate-800`}
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${theme.gradient}`} />
                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      {theme.tag}
                    </p>
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      Notifications
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Stay in sync with everything happening for your role.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <span className="inline-flex min-w-[2.25rem] justify-center rounded-full bg-white/70 px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm backdrop-blur dark:bg-slate-900/60 dark:text-gray-100">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label="Close notifications"
                      className="rounded-full bg-white/80 p-2 shadow-sm ring-1 ring-black/5 transition hover:bg-white dark:bg-slate-900/70 dark:ring-white/10"
                      onClick={onClose}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <div className="relative mt-4 flex items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      Unread
                    </span>
                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    <Button size="sm" variant="ghost" onClick={onMarkAllRead} className="text-xs">
                      Mark all read
                    </Button>
                  </div>
                )}
              </header>

              {error && error.message && !error.message.includes('websocket') && (
                <div className="border-b border-yellow-200 bg-yellow-50 px-6 py-3 text-sm text-yellow-700 dark:border-yellow-500/30 dark:bg-yellow-500/10 dark:text-yellow-200">
                  <strong>Note:</strong> {error.message.includes('Failed to load') 
                    ? 'Unable to fetch notifications. Please check your connection.'
                    : error.message || "Something went wrong while loading notifications."}
                </div>
              )}

              <div className="flex-1 overflow-y-auto bg-slate-50 px-6 py-6 dark:bg-slate-950">
                {isLoading ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Loading notifications...
                  </div>
                ) : hasNotifications ? (
                  <ul className="space-y-4">
                    {notifications.map((notification) => {
                      const isActive = activeNotification?.id === notification.id;
                      return (
                        <li key={notification.id}>
                          <button
                            type="button"
                            onClick={() => onSelectNotification(notification)}
                            className={`group flex w-full items-start gap-4 rounded-3xl bg-white p-4 text-left shadow-sm ring-1 ring-slate-100 transition duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:bg-slate-900 dark:ring-slate-800 ${
                              isActive ? "ring-2 ring-secondary shadow-lg" : ""
                            } ${notification.isRead ? "opacity-80" : ""}`}
                          >
                            <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${theme.iconBg}`}>
                              <BellRing className={`h-5 w-5 ${theme.accent}`} />
                            </span>
                            <div className="flex-1 space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-base font-semibold text-gray-900 dark:text-gray-50">
                                  {notification.title}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {formatTimestamp(notification.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {notification.message}
                              </p>
                              <div className="flex flex-wrap items-center gap-3 text-xs">
                                {!notification.isRead && (
                                  <span className="inline-flex items-center rounded-full bg-secondary/10 px-2 py-1 font-medium text-secondary">
                                    New
                                  </span>
                                )}
                                {notification.link && (
                                  <a
                                    className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                                    href={notification.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    Open
                                    <ArrowUpRight className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="h-full rounded-3xl border border-dashed border-slate-200 bg-white px-6 text-center text-sm text-muted-foreground shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <EmptyState role={role} />
                  </div>
                )}
              </div>
            </div>
        </motion.aside>
      </>
    )}
  </AnimatePresence>
  );

  const canUsePortal = typeof document !== "undefined" && document.body;
  return canUsePortal ? createPortal(drawerContent, document.body) : drawerContent;
};

export default NotificationDrawer;
