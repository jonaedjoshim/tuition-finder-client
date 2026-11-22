import { Icon } from "../components/ui/Icon";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { adminAPI } from "../api";
import { useApi } from "../hooks/useApi";
import { notifySuccess, notifyError } from "../utils/toast";
import { timeAgo, getErrorMessage } from "../utils/helpers";
import DashboardLayout from "../components/common/DashboardLayout";
import {
  Button,
  Card,
  Badge,
  EmptyState,
  Alert,
  Textarea,
  Modal,
  ConfirmDialog,
  Skeleton,
} from "../components/ui";

const TABS = ["overview", "users", "posts", "verification", "reports"];

const SIDE_LINKS = [
  { icon: <Icon name="barChart" />, label: "Overview", tab: "overview" },
  { icon: <Icon name="users" />, label: "User Management", tab: "users" },
  {
    icon: <Icon name="file" />,
    label: "Post Approvals",
    tab: "posts",
    badgeKey: "posts",
  },
  {
    icon: <Icon name="check" />,
    label: "Tutor Verification",
    tab: "verification",
    badgeKey: "verification",
  },
  {
    icon: <Icon name="flag" />,
    label: "Reports",
    tab: "reports",
    badgeKey: "reports",
  },
];

// useApi keeps the raw axios response; response.data is the API envelope.
const unwrap = (source) => source?.data ?? source;
const toArray = (value) =>
  Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [];
const listFrom = (source) => toArray(unwrap(source)?.data ?? unwrap(source));
const fieldFrom = (source, key) => unwrap(source)?.[key];
const pageFrom = (source) => unwrap(source)?.pagination || {};
const docUrl = (d) =>
  typeof d === "string" ? d : d?.url || d?.path || d?.file || "";

function StatusBadge({ status }) {
  const map = {
    active: ["green", "Active"],
    pending: ["amber", "Pending"],
    suspended: ["red", "Suspended"],
    approved: ["green", "Approved"],
    rejected: ["red", "Rejected"],
    open: ["amber", "Open"],
    resolved: ["green", "Resolved"],
    verified: ["green", "Verified"],
    submitted: ["amber", "Submitted"],
    unverified: ["blue", "Unverified"],
  };
  const [variant, label] = map[status] || ["blue", status];
  return <Badge variant={variant}>{label}</Badge>;
}

function Pagination({ pagination, page, onPage }) {
  const totalPages = Number(pagination?.totalPages || 0);
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <Button
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        variant="outline"
        size="sm"
      >
        ← Prev
      </Button>
      <span className="text-sm text-muted px-2.5">
        Page {pagination.page || page} of {totalPages}
      </span>
      <Button
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        variant="outline"
        size="sm"
      >
        Next →
      </Button>
    </div>
  );
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const paramTab = searchParams.get("tab");
  const tab = TABS.includes(paramTab) ? paramTab : "overview";
  const goToTab = (next) => {
    const params = new URLSearchParams(searchParams);
    if (next === "overview") params.delete("tab");
    else params.set("tab", next);
    setSearchParams(params, { replace: true });
  };

  const [userFilter, setUserFilter] = useState("all");
  const [userPage, setUserPage] = useState(1);
  const [postPage, setPostPage] = useState(1);
  const [tutorPage, setTutorPage] = useState(1);
  const [reportPage, setReportPage] = useState(1);

  const statsApi = useApi(() => adminAPI.getStats(), []);
  const usersApi = useApi(
    () =>
      adminAPI.getUsers({
        ...(userFilter !== "all" ? { role: userFilter } : {}),
        page: userPage,
        limit: 10,
      }),
    [userFilter, userPage],
  );
  const postsApi = useApi(
    () => adminAPI.getPosts({ page: postPage, limit: 10 }),
    [postPage],
  );
  const tutorsApi = useApi(
    () => adminAPI.getUnverified({ page: tutorPage, limit: 10 }),
    [tutorPage],
  );
  const reportsApi = useApi(
    () => adminAPI.getReports({ page: reportPage, limit: 10 }),
    [reportPage],
  );

  const [userActionId, setUserActionId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [postActionId, setPostActionId] = useState(null);
  const [rejectPostTarget, setRejectPostTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingPost, setRejectingPost] = useState(false);
  const [verifyActionId, setVerifyActionId] = useState(null);
  const [rejectTutorTarget, setRejectTutorTarget] = useState(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectingTutor, setRejectingTutor] = useState(false);
  const [reportActionId, setReportActionId] = useState(null);

  const stats = fieldFrom(statsApi.data, "stats") ?? unwrap(statsApi.data);
  const users = listFrom(usersApi.data);
  const userPagination = pageFrom(usersApi.data);
  const posts = listFrom(postsApi.data);
  const postPagination = pageFrom(postsApi.data);
  const tutorsBody = unwrap(tutorsApi.data);
  const unverifiedTutors = toArray(tutorsBody?.data ?? tutorsBody?.tutors);
  const reports = listFrom(reportsApi.data);
  const reportPagination = pageFrom(reportsApi.data);

  const pendingPosts = posts.filter((p) => p.status === "pending");
  const openReports = reports.filter((r) => r.status === "open");

  const refreshStats = () => statsApi.reload();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleUserStatus = async (id, status) => {
    setUserActionId(id);
    try {
      await adminAPI.updateUserStatus(id, status);
      notifySuccess(
        status === "suspended" ? "User suspended." : "User reinstated.",
      );
      usersApi.reload();
      refreshStats();
    } catch (err) {
      notifyError(getErrorMessage(err, "Could not update user status."));
    } finally {
      setUserActionId(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await adminAPI.deleteUser(deleteTarget._id);
      notifySuccess("User deleted successfully.");
      setDeleteTarget(null);
      usersApi.reload();
      refreshStats();
    } catch (err) {
      notifyError(getErrorMessage(err, "Could not delete user."));
    } finally {
      setDeleting(false);
    }
  };

  const handleApprovePost = async (id) => {
    setPostActionId(id);
    try {
      await adminAPI.approvePost(id);
      notifySuccess("Tuition post approved.");
      postsApi.reload();
      refreshStats();
    } catch (err) {
      notifyError(getErrorMessage(err, "Could not approve post."));
    } finally {
      setPostActionId(null);
    }
  };

  const handleRejectPost = async () => {
    if (!rejectPostTarget) return;
    setRejectingPost(true);
    try {
      await adminAPI.rejectPost(rejectPostTarget._id, rejectReason.trim());
      notifySuccess("Tuition post rejected.");
      setRejectPostTarget(null);
      setRejectReason("");
      postsApi.reload();
      refreshStats();
    } catch (err) {
      notifyError(getErrorMessage(err, "Could not reject post."));
    } finally {
      setRejectingPost(false);
    }
  };

  const handleVerify = async (id) => {
    setVerifyActionId(id);
    try {
      await adminAPI.verifyTutor(id);
      notifySuccess("Tutor verified.");
      tutorsApi.reload();
      refreshStats();
    } catch (err) {
      notifyError(getErrorMessage(err, "Could not verify tutor."));
    } finally {
      setVerifyActionId(null);
    }
  };

  const handleRejectTutor = async () => {
    if (!rejectTutorTarget) return;
    setRejectingTutor(true);
    try {
      await adminAPI.rejectTutor(rejectTutorTarget._id, rejectNote.trim());
      notifySuccess("Tutor verification rejected.");
      setRejectTutorTarget(null);
      setRejectNote("");
      tutorsApi.reload();
      refreshStats();
    } catch (err) {
      notifyError(getErrorMessage(err, "Could not reject tutor verification."));
    } finally {
      setRejectingTutor(false);
    }
  };

  const handleResolveReport = async (id) => {
    setReportActionId(id);
    try {
      await adminAPI.resolveReport(id);
      notifySuccess("Report marked as resolved.");
      reportsApi.reload();
      refreshStats();
    } catch (err) {
      notifyError(getErrorMessage(err, "Could not resolve report."));
    } finally {
      setReportActionId(null);
    }
  };

  return (
    <>
      <DashboardLayout
        user={user}
        links={SIDE_LINKS}
        activeTab={tab}
        onTabChange={goToTab}
        title={
          {
            overview: "Admin Overview",
            users: "User Management",
            posts: "Tuition Post Approvals",
            verification: "Tutor Verification",
            reports: "Reports & Complaints",
          }[tab] || "Admin Overview"
        }
        subtitle="Manage users, approvals, verification and reports."
        badges={{
          posts: pendingPosts.length,
          verification: unverifiedTutors.length,
          reports: openReports.length,
        }}
        onLogout={handleLogout}
      >
        {/* ===== OVERVIEW ===== */}
        {tab === "overview" && (
          <>
            {statsApi.loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((n) => (
                  <Skeleton key={n} className="h-24 w-full rounded-card" />
                ))}
              </div>
            ) : !stats ? (
              <Alert variant="error"> Could not load dashboard stats.</Alert>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
                  {[
                    {
                      icon: <Icon name="users" />,
                      label: "Total Users",
                      value: stats.totalUsers,
                      color: "text-brand",
                    },
                    {
                      icon: <Icon name="file" />,
                      label: "Pending Posts",
                      value: stats.pendingPosts,
                      color: "text-warning",
                    },
                    {
                      icon: <Icon name="check" />,
                      label: "Pending Verification",
                      value: stats.pendingVerifications,
                      color: "text-accent",
                    },
                    {
                      icon: <Icon name="flag" />,
                      label: "Open Reports",
                      value: stats.openReports,
                      color: "text-danger",
                    },
                  ].map((s) => (
                    <Card key={s.label} className="p-5">
                      <div className="text-2xl mb-3">{s.icon}</div>
                      <div
                        className={`text-2xl font-semibold font-sora ${s.color}`}
                      >
                        {s.value ?? 0}
                      </div>
                      <div className="text-sm text-muted/70 mt-0.5">
                        {s.label}
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <Card className="p-6">
                    <h3 className="text-base font-bold mb-4 font-sora">
                      User Breakdown
                    </h3>
                    {[
                      ["Students", stats.totalStudents, "text-brand"],
                      ["Tutors", stats.totalTutors, "text-accent"],
                    ].map(([label, val, color]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between py-2.5 border-b border-line/50"
                      >
                        <span className="text-sm text-muted">{label}</span>
                        <span
                          className={`text-base font-bold font-sora ${color}`}
                        >
                          {val ?? 0}
                        </span>
                      </div>
                    ))}
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-base font-bold mb-4 font-sora">
                      Needs Your Attention
                    </h3>
                    <div className="flex flex-col gap-2.5">
                      <button
                        onClick={() => goToTab("posts")}
                        className="w-full text-left"
                      >
                        <Alert
                          variant="warning"
                          className="cursor-pointer justify-between"
                        >
                          <span>
                            {stats.pendingPosts ?? 0} posts awaiting approval
                          </span>
                          <span>→</span>
                        </Alert>
                      </button>
                      <button
                        onClick={() => goToTab("verification")}
                        className="w-full text-left"
                      >
                        <Alert
                          variant="info"
                          className="cursor-pointer justify-between"
                        >
                          <span>
                            {stats.pendingVerifications ?? 0} tutors need
                            verification
                          </span>
                          <span>→</span>
                        </Alert>
                      </button>
                      <button
                        onClick={() => goToTab("reports")}
                        className="w-full text-left"
                      >
                        <Alert
                          variant="error"
                          className="cursor-pointer justify-between"
                        >
                          <span> {stats.openReports ?? 0} open reports</span>
                          <span>→</span>
                        </Alert>
                      </button>
                    </div>
                  </Card>
                </div>
              </>
            )}
          </>
        )}

        {/* ===== USERS ===== */}
        {tab === "users" && (
          <>
            <div className="flex gap-1.5 mb-5 max-w-[360px]">
              {["all", "student", "tutor"].map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setUserFilter(f);
                    setUserPage(1);
                  }}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
                    userFilter === f
                      ? "bg-brand text-surface"
                      : "bg-surface text-muted border border-line"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            {usersApi.loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : usersApi.error ? (
              <Alert variant="error">
                {typeof usersApi.error === "string"
                  ? usersApi.error
                  : getErrorMessage(usersApi.error, "Could not load users.")}
              </Alert>
            ) : users.length === 0 ? (
              <EmptyState
                icon={<Icon name="users" />}
                title="No users found"
                desc="Try a different role filter."
              />
            ) : (
              <>
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-canvas text-left text-xs text-muted/70 uppercase tracking-wide">
                          <th className="px-5 py-3 font-semibold">Name</th>
                          <th className="px-5 py-3 font-semibold">Email</th>
                          <th className="px-5 py-3 font-semibold">Role</th>
                          <th className="px-5 py-3 font-semibold">Joined</th>
                          <th className="px-5 py-3 font-semibold">Status</th>
                          <th className="px-5 py-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u._id} className="border-t border-line/50">
                            <td className="px-5 py-3.5 font-semibold">
                              {u.name}
                            </td>
                            <td className="px-5 py-3.5 text-muted/70">
                              {u.email}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="px-2.5 py-0.5 rounded-full bg-line/40 text-muted text-xs capitalize">
                                {u.role}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-muted/70">
                              {timeAgo(u.createdAt)}
                            </td>
                            <td className="px-5 py-3.5">
                              <StatusBadge status={u.status} />
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex gap-1.5 flex-wrap">
                                {u.status !== "suspended" ? (
                                  <Button
                                    onClick={() =>
                                      handleUserStatus(u._id, "suspended")
                                    }
                                    disabled={userActionId === u._id}
                                    variant="danger"
                                    size="sm"
                                  >
                                    Suspend
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={() =>
                                      handleUserStatus(u._id, "active")
                                    }
                                    disabled={userActionId === u._id}
                                    variant="secondary"
                                    size="sm"
                                  >
                                    Reinstate
                                  </Button>
                                )}
                                <Button
                                  onClick={() => setDeleteTarget(u)}
                                  variant="outline"
                                  size="sm"
                                >
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
                <Pagination
                  pagination={userPagination}
                  page={userPage}
                  onPage={setUserPage}
                />
              </>
            )}
          </>
        )}

        {/* ===== POST APPROVALS ===== */}
        {tab === "posts" && (
          <>
            {postsApi.loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} className="h-28 w-full rounded-card" />
                ))}
              </div>
            ) : postsApi.error ? (
              <Alert variant="error">
                {typeof postsApi.error === "string"
                  ? postsApi.error
                  : getErrorMessage(postsApi.error, "Could not load posts.")}
              </Alert>
            ) : posts.length === 0 ? (
              <EmptyState
                icon={<Icon name="file" />}
                title="No posts yet"
                desc="Tuition posts submitted by students will appear here."
              />
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {posts.map((p) => (
                    <Card key={p._id} className="p-6">
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div>
                          <div className="flex items-center gap-2.5 mb-2">
                            <h3 className="text-base font-bold font-sora">
                              {p.subject} — {p.classLevel}
                            </h3>
                            <StatusBadge status={p.status} />
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted">
                            <span> {p.location}</span>
                            <span> ৳{p.salary}/hr</span>
                            <span> {p.postedBy?.name || "Unknown"}</span>
                            <span> {timeAgo(p.createdAt)}</span>
                          </div>
                          {p.rejectionReason && (
                            <p className="text-[13px] text-danger mt-2.5">
                              Rejection reason: {p.rejectionReason}
                            </p>
                          )}
                        </div>
                        {p.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleApprovePost(p._id)}
                              disabled={postActionId === p._id}
                              size="sm"
                            >
                              Approve
                            </Button>
                            <Button
                              onClick={() => {
                                setRejectPostTarget(p);
                                setRejectReason("");
                              }}
                              disabled={postActionId === p._id}
                              variant="danger"
                              size="sm"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
                <Pagination
                  pagination={postPagination}
                  page={postPage}
                  onPage={setPostPage}
                />
              </>
            )}
          </>
        )}

        {/* ===== VERIFICATION ===== */}
        {tab === "verification" && (
          <>
            {tutorsApi.loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} className="h-24 w-full rounded-card" />
                ))}
              </div>
            ) : tutorsApi.error ? (
              <Alert variant="error">
                {typeof tutorsApi.error === "string"
                  ? tutorsApi.error
                  : getErrorMessage(
                      tutorsApi.error,
                      "Could not load tutor profiles.",
                    )}
              </Alert>
            ) : unverifiedTutors.length === 0 ? (
              <EmptyState
                icon={<Icon name="check" />}
                title="All caught up"
                desc="No tutors are currently pending verification."
              />
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {unverifiedTutors.map((t) => {
                    const docs = toArray(t.documents);
                    return (
                      <Card key={t._id} className="p-6">
                        <div className="flex items-start justify-between flex-wrap gap-3">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-full border-2 border-brand bg-transparent flex items-center justify-center text-brand font-bold font-sora shrink-0">
                              {(t.user?.name || "TU").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="font-bold font-sora">
                                  {t.user?.name || "Unknown Tutor"}
                                </div>
                                <StatusBadge
                                  status={t.verificationStatus || "unverified"}
                                />
                              </div>
                              <div className="text-[13px] text-muted/70">
                                {t.user?.email} • {docs.length} document(s)
                                uploaded
                              </div>
                              {t.verificationNote && (
                                <p className="text-[13px] text-muted mt-1.5">
                                  {t.verificationNote}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {docs.slice(0, 3).map((d, i) => {
                              const url = docUrl(d);
                              return url ? (
                                <a
                                  key={i}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="no-underline"
                                >
                                  <Button variant="outline" size="sm">
                                    View Doc {i + 1}
                                  </Button>
                                </a>
                              ) : null;
                            })}
                            <Button
                              onClick={() => handleVerify(t._id)}
                              disabled={verifyActionId === t._id}
                              size="sm"
                            >
                              Verify
                            </Button>
                            <Button
                              onClick={() => {
                                setRejectTutorTarget(t);
                                setRejectNote("");
                              }}
                              variant="danger"
                              size="sm"
                            >
                              Reject
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                <Pagination
                  pagination={pageFrom(tutorsApi.data)}
                  page={tutorPage}
                  onPage={setTutorPage}
                />
              </>
            )}
          </>
        )}

        {/* ===== REPORTS ===== */}
        {tab === "reports" && (
          <>
            {reportsApi.loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} className="h-28 w-full rounded-card" />
                ))}
              </div>
            ) : reportsApi.error ? (
              <Alert variant="error">
                {typeof reportsApi.error === "string"
                  ? reportsApi.error
                  : getErrorMessage(
                      reportsApi.error,
                      "Could not load reports.",
                    )}
              </Alert>
            ) : reports.length === 0 ? (
              <EmptyState
                icon={<Icon name="flag" />}
                title="No reports"
                desc="User-submitted reports and complaints will appear here."
              />
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {reports.map((r) => (
                    <Card key={r._id} className="p-6">
                      <div className="flex items-start justify-between flex-wrap gap-3 mb-2.5">
                        <div>
                          <div className="mb-1.5 flex items-center gap-2 flex-wrap">
                            <StatusBadge status={r.status} />
                            {r.type && <Badge variant="blue">{r.type}</Badge>}
                          </div>
                          <h3 className="text-[15px] font-bold font-sora">
                            Against: {r.against?.name || "Unknown"}
                          </h3>
                        </div>
                        {r.status !== "resolved" && (
                          <Button
                            onClick={() => handleResolveReport(r._id)}
                            disabled={reportActionId === r._id}
                            size="sm"
                          >
                            Mark Resolved
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-muted leading-relaxed mb-2">
                        {r.reason}
                      </p>
                      <div className="text-xs text-muted/70">
                        Reported by {r.reportedBy?.name || "Unknown"} •{" "}
                        {timeAgo(r.createdAt)}
                      </div>
                    </Card>
                  ))}
                </div>
                <Pagination
                  pagination={reportPagination}
                  page={reportPage}
                  onPage={setReportPage}
                />
              </>
            )}
          </>
        )}
      </DashboardLayout>

      {/* Delete user */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete user?"
        message={`This will permanently delete ${deleteTarget?.name || "this user"} and their related data.`}
        confirmLabel={deleting ? "Deleting..." : "Delete User"}
        danger
        onConfirm={handleDeleteUser}
      />

      {/* Reject post with optional reason */}
      <Modal
        open={!!rejectPostTarget}
        onClose={() => setRejectPostTarget(null)}
        title="Reject Tuition Post"
        footer={
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRejectPostTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              disabled={rejectingPost}
              onClick={handleRejectPost}
            >
              {rejectingPost ? "Rejecting..." : "Reject Post"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted mb-3">
          Rejecting <strong>{rejectPostTarget?.subject}</strong> by{" "}
          {rejectPostTarget?.postedBy?.name || "unknown"}.
        </p>
        <Textarea
          label="Reason (optional)"
          className="h-[100px]"
          placeholder="Explain why this post was rejected..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
        />
      </Modal>

      {/* Reject tutor verification with note */}
      <Modal
        open={!!rejectTutorTarget}
        onClose={() => setRejectTutorTarget(null)}
        title="Reject Tutor Verification"
        footer={
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRejectTutorTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              disabled={rejectingTutor}
              onClick={handleRejectTutor}
            >
              {rejectingTutor ? "Rejecting..." : "Reject Verification"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted mb-3">
          Rejecting verification for{" "}
          <strong>{rejectTutorTarget?.user?.name || "this tutor"}</strong>.
        </p>
        <Textarea
          label="Note to tutor"
          className="h-[100px]"
          placeholder="What should the tutor fix before re-applying?"
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
        />
      </Modal>
    </>
  );
}
