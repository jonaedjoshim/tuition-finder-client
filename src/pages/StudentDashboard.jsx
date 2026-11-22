import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postAPI, applicationAPI, messageAPI, authAPI, reviewAPI, reportAPI } from '../api';
import { useApi } from '../hooks/useApi';
import { notifySuccess, notifyError } from '../utils/toast';
import { colorFor, initialsFor, timeAgo, getErrorMessage } from '../utils/helpers';
import DashboardLayout from '../components/common/DashboardLayout';
import { Button, Card, Badge, EmptyState, Alert, Input, Textarea, Modal, ConfirmDialog, Skeleton } from '../components/ui';

const TABS = ['dashboard', 'posts', 'applications', 'messages', 'profile'];

const SIDE_LINKS = [
  { icon: '📊', label: 'Dashboard', tab: 'dashboard' },
  { icon: '📝', label: 'My Posts', tab: 'posts' },
  { icon: '👥', label: 'Applications', tab: 'applications', badgeKey: 'applications' },
  { icon: '🔍', label: 'Find Tutors', to: '/tutors' },
  { icon: '💬', label: 'Messages', tab: 'messages', badgeKey: 'messages' },
  { icon: '👤', label: 'Profile', tab: 'profile' },
];

const TITLES = {
  dashboard: "Here's what's happening with your tutoring today.",
  posts: 'Manage the tuition requirements you have posted.',
  applications: 'Review tutors who applied to your posts.',
  messages: 'Chat with tutors and students.',
  profile: 'Keep your account details up to date.',
};

// useApi keeps the raw axios response; response.data is the API envelope.
const unwrap = (source) => source?.data ?? source;
const toArray = (value) => (Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : []);
const listFrom = (source) => toArray(unwrap(source)?.data ?? unwrap(source));
const fieldFrom = (source, key) => unwrap(source)?.[key];
const pageFrom = (source) => unwrap(source)?.pagination || {};

function StatusBadge({ status }) {
  const map = {
    approved: ['green', 'Active'], pending: ['amber', 'Pending'], rejected: ['red', 'Rejected'],
    accepted: ['green', 'Accepted ✓'], closed: ['blue', 'Closed'], withdrawn: ['blue', 'Withdrawn'],
  };
  const [variant, label] = map[status] || ['blue', status];
  return <Badge variant={variant}>{label}</Badge>;
}

function Pagination({ pagination, page, onPage }) {
  const totalPages = Number(pagination?.totalPages || 0);
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <Button disabled={page <= 1} onClick={() => onPage(page - 1)} variant="outline" size="sm">← Prev</Button>
      <span className="text-sm text-gray-500 px-2.5">Page {pagination.page || page} of {totalPages}</span>
      <Button disabled={page >= totalPages} onClick={() => onPage(page + 1)} variant="outline" size="sm">Next →</Button>
    </div>
  );
}

export default function StudentDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Deep links: /student/messages and /student/profile map to this component.
  const paramTab = searchParams.get('tab');
  const pathTab = location.pathname.endsWith('/messages')
    ? 'messages'
    : location.pathname.endsWith('/profile') ? 'profile' : null;
  const tab = TABS.includes(paramTab) ? paramTab : (pathTab || 'dashboard');

  const goToTab = (next) => {
    const base = next === 'messages' ? '/student/messages'
      : next === 'profile' ? '/student/profile' : '/student/dashboard';
    navigate(`${base}?tab=${encodeURIComponent(next)}`, { replace: true });
  };

  const [postPage, setPostPage] = useState(1);
  const [appPage, setAppPage] = useState(1);

  const postsApi = useApi(() => postAPI.getMine({ page: postPage, limit: 10 }), [postPage]);
  const appsApi = useApi(() => applicationAPI.getMyReceived({ page: appPage, limit: 10 }), [appPage]);
  const convApi = useApi(() => messageAPI.getConversations(), []);

  const [activeConv, setActiveConv] = useState(null);
  const activeConvId = activeConv?._id;
  const msgsApi = useApi(
    () => (activeConvId ? messageAPI.getMessages(activeConvId) : Promise.resolve({ data: { data: [] } })),
    [activeConvId]
  );
  const [msgText, setMsgText] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [ratingTarget, setRatingTarget] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [reportTarget, setReportTarget] = useState(null);
  const [reportType, setReportType] = useState('user');
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    setProfileForm({ name: user?.name || '', phone: user?.phone || '' });
  }, [user?.name, user?.phone]);

  const posts = listFrom(postsApi.data);
  const postPagination = pageFrom(postsApi.data);
  const applications = listFrom(appsApi.data);
  const appPagination = pageFrom(appsApi.data);
  const conversations = toArray(fieldFrom(convApi.data, 'conversations'));
  const messages = listFrom(msgsApi.data);

  const activePosts = posts.filter((p) => p.status === 'approved');
  const pendingApps = applications.filter((a) => a.status === 'pending');
  const acceptedApps = applications.filter((a) => a.status === 'accepted');
  const unreadCount = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  // Poll conversations (and the open thread) while the Messages tab is active.
  const pollRefs = useRef({ conv: () => {}, msgs: () => {}, activeId: null });
  pollRefs.current.conv = convApi.reload;
  pollRefs.current.msgs = msgsApi.reload;
  pollRefs.current.activeId = activeConvId;
  useEffect(() => {
    if (tab !== 'messages') return undefined;
    const timer = setInterval(() => {
      pollRefs.current.conv();
      if (pollRefs.current.activeId) pollRefs.current.msgs();
    }, 15000);
    return () => clearInterval(timer);
  }, [tab]);

  const handleLogout = () => { logout(); navigate('/'); };

  const openConversation = (conv) => setActiveConv(conv);

  const sendMessage = async () => {
    if (!msgText.trim() || !activeConv) return;
    try {
      await messageAPI.send({ receiverId: activeConv._id, text: msgText.trim() });
      setMsgText('');
      msgsApi.reload();
      convApi.reload();
    } catch (err) {
      notifyError(getErrorMessage(err, 'Could not send your message.'));
    }
  };

  const handleDeletePost = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await postAPI.delete(deleteTarget._id);
      notifySuccess('Post deleted successfully.');
      setDeleteTarget(null);
      postsApi.reload();
    } catch (err) {
      notifyError(getErrorMessage(err, 'Could not delete post.'));
    } finally {
      setDeleting(false);
    }
  };

  const handleApplicationAction = async (id, status) => {
    setActionLoadingId(id);
    try {
      await applicationAPI.updateStatus(id, status);
      notifySuccess(status === 'accepted' ? 'Application accepted.' : 'Application rejected.');
      appsApi.reload();
      postsApi.reload();
    } catch (err) {
      notifyError(getErrorMessage(err, 'Could not update application.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSubmitReview = async () => {
    const tutorId = ratingTarget?.tutor?._id;
    if (!tutorId) return;
    setReviewSubmitting(true);
    try {
      await reviewAPI.add(tutorId, { rating: Number(reviewRating), comment: reviewComment.trim() });
      notifySuccess('Thanks for rating your tutor!');
      setRatingTarget(null);
      setReviewComment('');
      setReviewRating(5);
      appsApi.reload();
    } catch (err) {
      notifyError(getErrorMessage(err, 'Could not submit your rating.'));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleSubmitReport = async () => {
    const against = reportTarget?.tutor?._id;
    if (!against || !reportReason.trim()) return;
    setReportSubmitting(true);
    try {
      await reportAPI.create({ type: reportType, reason: reportReason.trim(), against });
      notifySuccess('Report submitted. Thank you.');
      setReportTarget(null);
      setReportReason('');
      setReportType('user');
    } catch (err) {
      notifyError(getErrorMessage(err, 'Could not submit your report.'));
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      const res = await authAPI.updateProfile(profileForm);
      updateUser(res?.data?.user || profileForm);
      notifySuccess('Profile updated successfully.');
    } catch (err) {
      notifyError(getErrorMessage(err, 'Could not update profile.'));
    } finally {
      setProfileSaving(false);
    }
  };

  const actions = (
    <Link to="/post-tuition" className="no-underline"><Button>+ Post Tuition</Button></Link>
  );

  return (
    <>
      <DashboardLayout
        user={user}
        links={SIDE_LINKS}
        activeTab={tab}
        onTabChange={goToTab}
        title={tab === 'dashboard' ? `Hello, ${user?.name?.split(' ')[0] || 'there'} 👋` : ({
          posts: 'My Tuition Posts', applications: 'Tutor Applications',
          messages: 'Messages', profile: 'My Profile',
        }[tab] || 'Dashboard')}
        subtitle={TITLES[tab]}
        actions={actions}
        badges={{ applications: pendingApps.length, messages: unreadCount }}
        onLogout={handleLogout}
      >
        {/* ===== DASHBOARD ===== */}
        {tab === 'dashboard' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
              {[
                { icon: '📝', label: 'Active Posts', value: activePosts.length, color: 'text-royal' },
                { icon: '👥', label: 'Applications', value: applications.length, color: 'text-violet' },
                { icon: '✅', label: 'Accepted Tutors', value: acceptedApps.length, color: 'text-green-600' },
                { icon: '⏳', label: 'Pending Review', value: pendingApps.length, color: 'text-amber-600' },
              ].map((s) => (
                <Card key={s.label} className="p-5">
                  <div className="text-2xl mb-3">{s.icon}</div>
                  <div className={`text-2xl font-extrabold font-sora ${s.color}`}>{s.value}</div>
                  <div className="text-sm text-gray-400 mt-0.5">{s.label}</div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900 font-sora">Recent Posts</h3>
                  <button onClick={() => goToTab('posts')} className="text-xs text-royal font-semibold bg-transparent border-none cursor-pointer">View all →</button>
                </div>
                {postsApi.loading ? (
                  <div className="space-y-3"><Skeleton className="h-14 w-full rounded-xl" /><Skeleton className="h-14 w-full rounded-xl" /></div>
                ) : posts.length === 0 ? (
                  <p className="text-[13px] text-gray-400">No posts yet.</p>
                ) : (
                  posts.slice(0, 2).map((p) => (
                    <div key={p._id} className="flex items-center justify-between py-3 border-b border-gray-50">
                      <div>
                        <div className="text-sm font-semibold text-gray-900 font-sora">{p.subject} • {p.classLevel}</div>
                        <div className="text-xs text-gray-400 mt-0.5">📍 {p.location}</div>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                  ))
                )}
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-gray-900 font-sora">Recent Applications</h3>
                  <button onClick={() => goToTab('applications')} className="text-xs text-royal font-semibold bg-transparent border-none cursor-pointer">View all →</button>
                </div>
                {appsApi.loading ? (
                  <div className="space-y-3"><Skeleton className="h-14 w-full rounded-xl" /><Skeleton className="h-14 w-full rounded-xl" /></div>
                ) : applications.length === 0 ? (
                  <p className="text-[13px] text-gray-400">No applications yet.</p>
                ) : (
                  applications.slice(0, 3).map((a) => {
                    const tutorName = a.tutor?.name || 'Tutor';
                    return (
                      <div key={a._id} className="flex items-center gap-3 py-2.5 border-b border-gray-50">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: colorFor(tutorName) }}>
                          {initialsFor(tutorName)}
                        </div>
                        <div className="flex-1">
                          <div className="text-[13px] font-semibold text-gray-900">{tutorName}</div>
                          <div className="text-[11px] text-gray-400">{a.post?.subject} • {timeAgo(a.createdAt)}</div>
                        </div>
                        <StatusBadge status={a.status} />
                      </div>
                    );
                  })
                )}
              </Card>
            </div>
          </>
        )}

        {/* ===== MY POSTS ===== */}
        {tab === 'posts' && (
          <>
            {postsApi.loading ? (
              <div className="space-y-4">{[1, 2, 3].map((n) => <Skeleton key={n} className="h-28 w-full rounded-2xl" />)}</div>
            ) : postsApi.error ? (
              <Alert variant="error">⚠️ {typeof postsApi.error === 'string' ? postsApi.error : getErrorMessage(postsApi.error, 'Could not load your posts.')}</Alert>
            ) : posts.length === 0 ? (
              <EmptyState
                icon="📝"
                title="No posts yet"
                desc="Post a tuition requirement to find your perfect tutor."
                action={<Link to="/post-tuition" className="no-underline"><Button>+ Post Tuition</Button></Link>}
              />
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {posts.map((p) => {
                    const applicantCount = applications.filter((a) => a.post?._id === p._id).length;
                    return (
                      <Card key={p._id} className="p-6">
                        <div className="flex items-start justify-between flex-wrap gap-3">
                          <div>
                            <div className="flex items-center gap-2.5 mb-2">
                              <h3 className="text-[17px] font-bold text-gray-900 font-sora">{p.subject}</h3>
                              <StatusBadge status={p.status} />
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                              <span>📚 {p.classLevel}</span>
                              <span>📍 {p.location}</span>
                              <span>💰 ৳{p.salary}/hr</span>
                              <span>👥 {applicantCount} applicants</span>
                              <span>🕒 {timeAgo(p.createdAt)}</span>
                            </div>
                            {p.status === 'rejected' && p.rejectionReason && (
                              <p className="text-[13px] text-red-600 mt-2.5">
                                Rejection reason: {p.rejectionReason}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={() => goToTab('applications')} variant="secondary" size="sm">View Applicants</Button>
                            <Button onClick={() => setDeleteTarget(p)} variant="danger" size="sm">Delete</Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
                <Pagination pagination={postPagination} page={postPage} onPage={setPostPage} />
              </>
            )}
          </>
        )}

        {/* ===== APPLICATIONS ===== */}
        {tab === 'applications' && (
          <>
            {appsApi.loading ? (
              <div className="space-y-4">{[1, 2, 3].map((n) => <Skeleton key={n} className="h-16 w-full rounded-xl" />)}</div>
            ) : appsApi.error ? (
              <Alert variant="error">⚠️ {typeof appsApi.error === 'string' ? appsApi.error : getErrorMessage(appsApi.error, 'Could not load applications.')}</Alert>
            ) : applications.length === 0 ? (
              <EmptyState icon="👥" title="No applications yet" desc="Tutors will appear here once they apply to your posts." />
            ) : (
              <>
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left text-xs text-gray-400 uppercase tracking-wide">
                          <th className="px-5 py-3 font-semibold">Tutor</th>
                          <th className="px-5 py-3 font-semibold">For Subject</th>
                          <th className="px-5 py-3 font-semibold">Applied</th>
                          <th className="px-5 py-3 font-semibold">Status</th>
                          <th className="px-5 py-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map((a) => {
                          const tutorName = a.tutor?.name || 'Tutor';
                          return (
                            <tr key={a._id} className="border-t border-gray-50">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: colorFor(tutorName) }}>
                                    {initialsFor(tutorName)}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">{tutorName}</div>
                                    <div className="text-xs text-gray-400">{a.tutor?.email}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5">{a.post?.subject} • {a.post?.classLevel}</td>
                              <td className="px-5 py-3.5 text-gray-400">{timeAgo(a.createdAt)}</td>
                              <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                              <td className="px-5 py-3.5">
                                <div className="flex gap-1.5 flex-wrap">
                                  {a.status === 'pending' && (
                                    <>
                                      <Button onClick={() => handleApplicationAction(a._id, 'accepted')} disabled={actionLoadingId === a._id} size="sm">Accept</Button>
                                      <Button onClick={() => handleApplicationAction(a._id, 'rejected')} disabled={actionLoadingId === a._id} variant="danger" size="sm">Reject</Button>
                                    </>
                                  )}
                                  {a.status === 'accepted' && (
                                    <Button onClick={() => { setRatingTarget(a); setReviewRating(5); setReviewComment(''); }} variant="secondary" size="sm">⭐ Rate tutor</Button>
                                  )}
                                  <Button onClick={() => { setReportTarget(a); setReportReason(''); setReportType('user'); }} variant="outline" size="sm">🚩 Report</Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
                <Pagination pagination={appPagination} page={appPage} onPage={setAppPage} />
              </>
            )}
          </>
        )}

        {/* ===== MESSAGES ===== */}
        {tab === 'messages' && (
          <Card className="grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-[480px] overflow-hidden">
            <div className="border-b md:border-b-0 md:border-r border-gray-100 overflow-y-auto max-h-[480px]">
              {convApi.loading ? (
                <div className="space-y-3 p-5"><Skeleton className="h-12 w-full rounded-xl" /><Skeleton className="h-12 w-full rounded-xl" /></div>
              ) : conversations.length === 0 ? (
                <div className="p-6"><EmptyState icon="💬" title="No conversations" desc="Message a tutor to start chatting." /></div>
              ) : (
                conversations.map((c) => {
                  const otherName = c.user?.name || 'User';
                  return (
                    <button
                      key={c._id}
                      onClick={() => openConversation(c)}
                      className={`flex items-center gap-2.5 w-full px-4 py-3.5 border-b border-gray-50 text-left ${activeConv?._id === c._id ? 'bg-royal-light' : 'bg-white hover:bg-gray-50'}`}
                    >
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: colorFor(otherName) }}>
                        {initialsFor(otherName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold text-gray-900 truncate">{otherName}</div>
                        <div className="text-xs text-gray-400 truncate">{c.lastMessage?.text}</div>
                      </div>
                      {c.unreadCount > 0 && <span className="bg-royal text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{c.unreadCount}</span>}
                    </button>
                  );
                })
              )}
            </div>

            <div className="flex flex-col">
              {!activeConv ? (
                <div className="flex-1 flex flex-col justify-center"><EmptyState icon="💬" title="Select a conversation" desc="Choose someone from the list to view messages." /></div>
              ) : (
                <>
                  <div className="px-5 py-3.5 border-b border-gray-100 font-bold font-sora">{activeConv.user?.name || 'Conversation'}</div>
                  <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-2.5 max-h-[340px]">
                    {msgsApi.loading ? (
                      <p className="text-[13px] text-gray-400">Loading messages...</p>
                    ) : messages.length === 0 ? (
                      <p className="text-[13px] text-gray-400">No messages yet. Say hello!</p>
                    ) : (
                      messages.map((m) => (
                        <div
                          key={m._id}
                          className={`px-3.5 py-2 rounded-2xl max-w-[70%] text-sm ${
                            String(m.sender?._id || m.sender) === String(user?._id) ? 'self-end bg-royal text-white' : 'self-start bg-gray-100 text-gray-800'
                          }`}
                        >
                          {m.text}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2.5 p-4 border-t border-gray-100">
                    <input
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-royal"
                      placeholder="Type a message..."
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button onClick={sendMessage}>Send</Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        )}

        {/* ===== PROFILE ===== */}
        {tab === 'profile' && (
          <div className="max-w-xl">
            <Card className="p-7">
              <div className="flex items-center gap-4 mb-7 pb-6 border-b border-gray-100">
                <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-royal to-violet flex items-center justify-center text-white text-2xl font-bold font-sora">
                  {(user?.name || 'U').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 font-sora">{user?.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">👨‍🎓 Student Account</p>
                </div>
              </div>

              <Input label="Full Name" value={profileForm.name} onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))} />
              <Input label="Email" value={user?.email || ''} disabled />
              <Input label="Phone" value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} />
              <Button onClick={handleSaveProfile} disabled={profileSaving} className="mt-2">
                {profileSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Card>
          </div>
        )}
      </DashboardLayout>

      {/* Delete post confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete this post?"
        message="This will permanently remove the tuition post and cannot be undone."
        confirmLabel={deleting ? 'Deleting...' : 'Delete Post'}
        danger
        onConfirm={handleDeletePost}
      />

      {/* Rate tutor */}
      <Modal
        open={!!ratingTarget}
        onClose={() => setRatingTarget(null)}
        title={`⭐ Rate ${ratingTarget?.tutor?.name || 'Tutor'}`}
        footer={
          <div className="flex gap-2.5">
            <Button variant="outline" className="flex-1" onClick={() => setRatingTarget(null)}>Cancel</Button>
            <Button className="flex-1" disabled={reviewSubmitting} onClick={handleSubmitReview}>
              {reviewSubmitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>
        }
      >
        <div className="flex gap-2 mb-5">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer flex flex-col items-center gap-1">
              <input type="radio" name="student-review-rating" value={n} checked={reviewRating === n} onChange={() => setReviewRating(n)} className="sr-only" />
              <span className={`text-3xl ${n <= reviewRating ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
              <span className="text-[10px] text-gray-400">{n}</span>
            </label>
          ))}
        </div>
        <Textarea
          label="Comment (optional)"
          className="h-[100px]"
          placeholder="How was your experience?"
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
        />
      </Modal>

      {/* Report tutor */}
      <Modal
        open={!!reportTarget}
        onClose={() => setReportTarget(null)}
        title="🚩 Report User"
        footer={
          <div className="flex gap-2.5">
            <Button variant="outline" className="flex-1" onClick={() => setReportTarget(null)}>Cancel</Button>
            <Button variant="danger" className="flex-1" disabled={reportSubmitting || !reportReason.trim()} onClick={handleSubmitReport}>
              {reportSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        }
      >
        <label className="text-sm font-semibold text-gray-800 font-sora block mb-1.5">Report type</label>
        <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-royal mb-4">
          <option value="user">Inappropriate user behavior</option>
          <option value="post">Misleading tuition post</option>
          <option value="other">Something else</option>
        </select>
        <Textarea
          label="Reason"
          className="h-[100px]"
          placeholder="Tell us what happened..."
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
        />
      </Modal>
    </>
  );
}
