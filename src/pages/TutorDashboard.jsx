import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postAPI, tutorAPI, messageAPI, authAPI, applicationAPI } from '../api';
import { useApi } from '../hooks/useApi';
import { notifySuccess, notifyError } from '../utils/toast';
import { colorFor, initialsFor, timeAgo, getErrorMessage } from '../utils/helpers';
import DashboardLayout from '../components/common/DashboardLayout';
import { Button, Card, Badge, EmptyState, Alert, Input, Textarea, Modal, Skeleton } from '../components/ui';

const TABS = ['dashboard', 'jobs', 'applications', 'history', 'messages', 'profile'];

const SIDE_LINKS = [
  { icon: '📊', label: 'Dashboard', tab: 'dashboard' },
  { icon: '💼', label: 'Browse Jobs', tab: 'jobs' },
  { icon: '📋', label: 'My Applications', tab: 'applications', badgeKey: 'applications' },
  { icon: '📜', label: 'Tuition History', tab: 'history' },
  { icon: '💬', label: 'Messages', tab: 'messages', badgeKey: 'messages' },
  { icon: '👤', label: 'My Profile', tab: 'profile' },
];

const TITLES = {
  dashboard: 'Tuition opportunities matched to your profile.',
  jobs: 'Browse tuition requirements posted by students.',
  applications: 'Keep track of the applications you have sent.',
  history: 'Your accepted and completed tuitions.',
  messages: 'Chat with students and guardians.',
  profile: 'Manage your teaching profile and documents.',
};

// useApi keeps the raw axios response; response.data is the API envelope.
const unwrap = (source) => source?.data ?? source;
const toArray = (value) => (Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : []);
const listFrom = (source) => toArray(unwrap(source)?.data ?? unwrap(source));
const fieldFrom = (source, key) => unwrap(source)?.[key];
const pageFrom = (source) => unwrap(source)?.pagination || {};
const docUrl = (d) => (typeof d === 'string' ? d : d?.url || d?.path || d?.file || '');
const docName = (d, i) => (typeof d === 'string' ? `Document ${i + 1}` : d?.name || d?.originalName || `Document ${i + 1}`);

function StatusBadge({ status }) {
  const map = {
    pending: ['amber', 'Pending'], accepted: ['green', 'Accepted ✓'], rejected: ['red', 'Rejected'],
    withdrawn: ['blue', 'Withdrawn'], completed: ['green', 'Completed'], closed: ['blue', 'Closed'],
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

export default function TutorDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Deep links: /tutor/messages, /tutor/profile and /tutors/jobs map here.
  const paramTab = searchParams.get('tab');
  const path = location.pathname;
  const pathTab = path.endsWith('/messages') ? 'messages'
    : path.endsWith('/profile') ? 'profile'
    : path.endsWith('/jobs') ? 'jobs' : null;
  const tab = TABS.includes(paramTab) ? paramTab : (pathTab || 'dashboard');

  const goToTab = (next) => {
    const base = next === 'messages' ? '/tutor/messages'
      : next === 'profile' ? '/tutor/profile'
      : next === 'jobs' ? '/tutors/jobs' : '/tutor/dashboard';
    navigate(`${base}?tab=${encodeURIComponent(next)}`, { replace: true });
  };

  const [jobPage, setJobPage] = useState(1);
  const [appPage, setAppPage] = useState(1);

  const jobsApi = useApi(() => postAPI.getAll({ page: jobPage, limit: 20 }), [jobPage]);
  const appsApi = useApi(() => tutorAPI.getApplications({ page: appPage, limit: 20 }), [appPage]);
  const historyApi = useApi(() => tutorAPI.getHistory(), []);
  const convApi = useApi(() => messageAPI.getConversations(), []);
  const myProfileApi = useApi(() => tutorAPI.getMyProfile(), []);

  const [activeConv, setActiveConv] = useState(null);
  const activeConvId = activeConv?._id;
  const msgsApi = useApi(
    () => (activeConvId ? messageAPI.getMessages(activeConvId) : Promise.resolve({ data: { data: [] } })),
    [activeConvId]
  );
  const [msgText, setMsgText] = useState('');

  const [applyModal, setApplyModal] = useState(null);
  const [applyMsg, setApplyMsg] = useState('');
  const [applying, setApplying] = useState(false);
  const [withdrawingId, setWithdrawingId] = useState(null);

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '', phone: user?.phone || '', bio: user?.bio || '',
    qualification: '', experience: '', subjects: '', classLevel: '', location: '', area: '', fee: '', online: false,
  });
  const originalRef = useRef(null);
  const [profileSaving, setProfileSaving] = useState(false);

  // Prefill every tutor field from the backend profile as soon as it loads.
  useEffect(() => {
    const body = unwrap(myProfileApi.data);
    const p = body?.profile ?? body;
    if (!p || !p._id) return;
    const next = {
      name: user?.name || '',
      phone: user?.phone || '',
      bio: p.bio || user?.bio || '',
      qualification: p.qualification || '',
      experience: p.experience ?? '',
      subjects: (p.subjects || []).join(', '),
      classLevel: (p.classLevel || []).join(', '),
      location: p.location || '',
      area: p.area || '',
      fee: p.fee ?? '',
      online: !!p.online,
    };
    originalRef.current = next;
    setProfileForm(next);
  }, [myProfileApi.data, user?.name, user?.phone]);

  const jobs = listFrom(jobsApi.data);
  const jobPagination = pageFrom(jobsApi.data);
  const applications = listFrom(appsApi.data);
  const appPagination = pageFrom(appsApi.data);
  const history = listFrom(historyApi.data);
  const conversations = toArray(fieldFrom(convApi.data, 'conversations'));
  const messages = listFrom(msgsApi.data);

  const tutorBody = unwrap(myProfileApi.data);
  const tutorProfile = tutorBody?.profile ?? (tutorBody?._id ? tutorBody : null);
  const documents = toArray(tutorProfile?.documents);
  const verificationStatus = tutorProfile?.verificationStatus || (tutorProfile?.verified ? 'verified' : 'unverified');
  const verificationVariant = { verified: 'green', submitted: 'amber', rejected: 'red', unverified: 'blue' }[verificationStatus] || 'blue';

  const appliedPostIds = new Set(applications.map((a) => a.post?._id));
  const pendingApps = applications.filter((a) => a.status === 'pending');
  const acceptedApps = applications.filter((a) => a.status === 'accepted');
  const availableJobs = jobs.filter((j) => !appliedPostIds.has(j._id));
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

  const submitApplication = async () => {
    if (!applyModal) return;
    setApplying(true);
    try {
      await postAPI.apply(applyModal._id, { coverMessage: applyMsg });
      notifySuccess('Application submitted successfully.');
      setApplyModal(null);
      setApplyMsg('');
      appsApi.reload();
    } catch (err) {
      notifyError(getErrorMessage(err, 'Could not submit application.'));
    } finally {
      setApplying(false);
    }
  };

  const handleWithdraw = async (id) => {
    setWithdrawingId(id);
    try {
      await applicationAPI.withdraw(id);
      notifySuccess('Application withdrawn.');
      appsApi.reload();
    } catch (err) {
      notifyError(getErrorMessage(err, 'Could not withdraw application.'));
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleFileChange = (e) => {
    const picked = Array.from(e.target.files || []);
    const valid = picked.filter((f) => f.size <= 5 * 1024 * 1024);
    if (valid.length < picked.length) notifyError('Each document must be 5MB or smaller.');
    setFiles((prev) => [...prev, ...valid].slice(0, 5));
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!files.length) return;
    const formData = new FormData();
    files.forEach((file) => formData.append('documents', file));
    setUploading(true);
    try {
      await tutorAPI.uploadDocuments(formData);
      notifySuccess('Documents uploaded for verification.');
      setFiles([]);
      myProfileApi.reload();
    } catch (err) {
      notifyError(getErrorMessage(err, 'Could not upload documents.'));
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    const original = originalRef.current || {};
    const changed = {};
    Object.keys(profileForm).forEach((key) => {
      const nextValue = String(profileForm[key] ?? '');
      const oldValue = String(original[key] ?? '');
      if (nextValue !== oldValue && nextValue !== '') changed[key] = profileForm[key];
    });

    const userChanges = {};
    ['name', 'phone', 'bio'].forEach((key) => { if (key in changed) userChanges[key] = changed[key]; });

    const tutorChanges = {};
    if ('bio' in changed) tutorChanges.bio = changed.bio;
    if ('qualification' in changed) tutorChanges.qualification = changed.qualification;
    if ('experience' in changed) tutorChanges.experience = Number(changed.experience) || 0;
    if ('subjects' in changed) tutorChanges.subjects = String(changed.subjects).split(',').map((s) => s.trim()).filter(Boolean);
    if ('classLevel' in changed) tutorChanges.classLevel = String(changed.classLevel).split(',').map((s) => s.trim()).filter(Boolean);
    if ('location' in changed) tutorChanges.location = changed.location;
    if ('area' in changed) tutorChanges.area = changed.area;
    if ('fee' in changed) tutorChanges.fee = Number(changed.fee) || 0;
    if ('online' in changed) tutorChanges.online = !!changed.online;

    if (!Object.keys(userChanges).length && !Object.keys(tutorChanges).length) {
      notifySuccess('No changes to save.');
      return;
    }

    setProfileSaving(true);
    try {
      // Only send fields the user actually edited, so untouched data is never wiped.
      if (Object.keys(userChanges).length) {
        const res = await authAPI.updateProfile(userChanges);
        updateUser(res?.data?.user || userChanges);
      }
      if (Object.keys(tutorChanges).length) await tutorAPI.updateProfile(tutorChanges);
      notifySuccess('Profile updated successfully.');
      myProfileApi.reload();
    } catch (err) {
      notifyError(getErrorMessage(err, 'Could not update profile.'));
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <>
      <DashboardLayout
        user={user}
        links={SIDE_LINKS}
        activeTab={tab}
        onTabChange={goToTab}
        title={tab === 'dashboard' ? `Welcome back, ${user?.name?.split(' ')[0] || 'there'} 👋` : ({
          jobs: 'Browse Tuition Jobs', applications: 'My Applications', history: 'Tuition History',
          messages: 'Messages', profile: 'My Profile',
        }[tab] || 'Dashboard')}
        subtitle={TITLES[tab]}
        badges={{ applications: pendingApps.length, messages: unreadCount }}
        onLogout={handleLogout}
      >
        {/* ===== DASHBOARD ===== */}
        {tab === 'dashboard' && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
              {[
                { icon: '💼', label: 'Available Jobs', value: availableJobs.length, color: 'text-royal' },
                { icon: '📋', label: 'Applications Sent', value: applications.length, color: 'text-violet' },
                { icon: '✅', label: 'Active Students', value: acceptedApps.length, color: 'text-green-600' },
                { icon: '⏳', label: 'Pending', value: pendingApps.length, color: 'text-amber-600' },
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
                  <h3 className="text-base font-bold font-sora">New Tuition Jobs</h3>
                  <button onClick={() => goToTab('jobs')} className="text-xs text-royal font-semibold bg-transparent border-none cursor-pointer">View all →</button>
                </div>
                {jobsApi.loading ? (
                  <div className="space-y-3"><Skeleton className="h-14 w-full rounded-xl" /><Skeleton className="h-14 w-full rounded-xl" /></div>
                ) : availableJobs.length === 0 ? (
                  <p className="text-[13px] text-gray-400">No new jobs right now.</p>
                ) : (
                  availableJobs.slice(0, 3).map((j) => (
                    <div key={j._id} className="py-3 border-b border-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-sm font-semibold font-sora">{j.subject} • {j.classLevel}</div>
                          <div className="text-xs text-gray-400 mt-0.5">📍 {j.location} • ৳{j.salary}/hr</div>
                        </div>
                        <span className="text-[11px] text-gray-400">{timeAgo(j.createdAt)}</span>
                      </div>
                    </div>
                  ))
                )}
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold font-sora">Application Status</h3>
                  <button onClick={() => goToTab('applications')} className="text-xs text-royal font-semibold bg-transparent border-none cursor-pointer">View all →</button>
                </div>
                {appsApi.loading ? (
                  <div className="space-y-3"><Skeleton className="h-14 w-full rounded-xl" /><Skeleton className="h-14 w-full rounded-xl" /></div>
                ) : applications.length === 0 ? (
                  <p className="text-[13px] text-gray-400">No applications yet.</p>
                ) : (
                  applications.slice(0, 5).map((a) => (
                    <div key={a._id} className="flex justify-between items-center py-2.5 border-b border-gray-50">
                      <div>
                        <div className="text-[13px] font-semibold">{a.post?.subject} • {a.post?.classLevel}</div>
                        <div className="text-[11px] text-gray-400">{timeAgo(a.createdAt)}</div>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  ))
                )}
              </Card>
            </div>
          </>
        )}

        {/* ===== JOBS ===== */}
        {tab === 'jobs' && (
          <>
            {jobsApi.loading ? (
              <div className="space-y-4">{[1, 2, 3].map((n) => <Skeleton key={n} className="h-28 w-full rounded-2xl" />)}</div>
            ) : jobsApi.error ? (
              <Alert variant="error">⚠️ {typeof jobsApi.error === 'string' ? jobsApi.error : getErrorMessage(jobsApi.error, 'Could not load jobs.')}</Alert>
            ) : jobs.length === 0 ? (
              <EmptyState icon="💼" title="No jobs available" desc="Check back later for new tuition postings." />
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {jobs.map((j) => {
                    const alreadyApplied = appliedPostIds.has(j._id);
                    return (
                      <Card key={j._id} className="p-6">
                        <div className="flex items-start justify-between flex-wrap gap-3">
                          <div>
                            <h3 className="text-[17px] font-bold font-sora mb-2">{j.subject} Tutor Needed — {j.classLevel}</h3>
                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                              <span>📍 {j.location}</span>
                              <span>💰 ৳{j.salary}/hr</span>
                              <span>📅 {j.daysPerWeek} days/week</span>
                              <span>👤 {j.postedBy?.name || 'Guardian'}</span>
                              <span>🕒 {timeAgo(j.createdAt)}</span>
                            </div>
                          </div>
                          {alreadyApplied ? (
                            <Badge variant="green">✓ Applied</Badge>
                          ) : (
                            <Button onClick={() => { setApplyModal(j); setApplyMsg(''); }} size="sm">Apply Now</Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
                <Pagination pagination={jobPagination} page={jobPage} onPage={setJobPage} />
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
              <Alert variant="error">⚠️ {typeof appsApi.error === 'string' ? appsApi.error : getErrorMessage(appsApi.error, 'Could not load your applications.')}</Alert>
            ) : applications.length === 0 ? (
              <EmptyState icon="📋" title="No applications yet" desc="Apply to tuition jobs to see them here." />
            ) : (
              <>
                <Card className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left text-xs text-gray-400 uppercase tracking-wide">
                          <th className="px-5 py-3 font-semibold">Subject</th>
                          <th className="px-5 py-3 font-semibold">Class</th>
                          <th className="px-5 py-3 font-semibold">Location</th>
                          <th className="px-5 py-3 font-semibold">Fee</th>
                          <th className="px-5 py-3 font-semibold">Applied</th>
                          <th className="px-5 py-3 font-semibold">Status</th>
                          <th className="px-5 py-3 font-semibold">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {applications.map((a) => (
                          <tr key={a._id} className="border-t border-gray-50">
                            <td className="px-5 py-3.5 font-semibold">{a.post?.subject}</td>
                            <td className="px-5 py-3.5">{a.post?.classLevel}</td>
                            <td className="px-5 py-3.5">{a.post?.location}</td>
                            <td className="px-5 py-3.5">৳{a.post?.salary}/hr</td>
                            <td className="px-5 py-3.5 text-gray-400">{timeAgo(a.createdAt)}</td>
                            <td className="px-5 py-3.5"><StatusBadge status={a.status} /></td>
                            <td className="px-5 py-3.5">
                              {a.status === 'pending' && (
                                <Button onClick={() => handleWithdraw(a._id)} disabled={withdrawingId === a._id} variant="danger" size="sm">
                                  {withdrawingId === a._id ? 'Withdrawing...' : 'Withdraw'}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
                <Pagination pagination={appPagination} page={appPage} onPage={setAppPage} />
              </>
            )}
          </>
        )}

        {/* ===== HISTORY ===== */}
        {tab === 'history' && (
          <>
            {historyApi.loading ? (
              <div className="space-y-4">{[1, 2].map((n) => <Skeleton key={n} className="h-24 w-full rounded-2xl" />)}</div>
            ) : historyApi.error ? (
              <Alert variant="error">⚠️ {typeof historyApi.error === 'string' ? historyApi.error : getErrorMessage(historyApi.error, 'Could not load tuition history.')}</Alert>
            ) : history.length === 0 ? (
              <EmptyState icon="📜" title="No tuition history yet" desc="Accepted tuitions will show up here." />
            ) : (
              <div className="flex flex-col gap-4">
                {history.map((h) => (
                  <Card key={h._id} className="p-6 flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <h3 className="text-base font-bold font-sora">{h.post?.postedBy?.name || 'Student'}</h3>
                        <StatusBadge status={h.status} />
                      </div>
                      <div className="text-sm text-gray-500">{h.post?.subject} • {h.post?.classLevel} • ৳{h.post?.salary}/hr</div>
                    </div>
                  </Card>
                ))}
              </div>
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
                <div className="p-6"><EmptyState icon="💬" title="No conversations" desc="When students contact you, they'll appear here." /></div>
              ) : (
                conversations.map((c) => {
                  const otherName = c.user?.name || 'User';
                  return (
                    <button
                      key={c._id}
                      onClick={() => setActiveConv(c)}
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
                      <p className="text-[13px] text-gray-400">No messages yet.</p>
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
          <div className="max-w-2xl">
            <div className="max-w-[420px] mb-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold font-sora">Verification status</h3>
                <Badge variant={verificationVariant}>{verificationStatus}</Badge>
              </div>
              {tutorProfile?.verificationNote && (
                <Alert variant={verificationStatus === 'rejected' ? 'error' : 'info'} className="mb-3">
                  📝 {tutorProfile.verificationNote}
                </Alert>
              )}
              {documents.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {documents.map((d, i) => {
                    const url = docUrl(d);
                    return url ? (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="no-underline">
                        <Badge variant="blue">🔗 {docName(d, i)}</Badge>
                      </a>
                    ) : null;
                  })}
                </div>
              )}
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="block w-full text-xs text-gray-500 file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-royal-light file:text-royal file:font-semibold file:cursor-pointer mb-2"
              />
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {files.map((f, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-600 rounded-full px-2.5 py-1">{f.name}</span>
                  ))}
                </div>
              )}
              <Button onClick={handleUpload} disabled={!files.length || uploading} variant="secondary" size="sm">
                {uploading ? 'Uploading...' : 'Upload Documents (max 5, 5MB each)'}
              </Button>
            </div>

            <Card className="p-7 mb-5">
              <h3 className="text-base font-bold mb-4 font-sora">Basic Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <Input label="Full Name" value={profileForm.name} onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))} />
                <Input label="Phone" value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} />
              </div>
              <Input label="Email" value={user?.email || ''} disabled />
              <Textarea
                label="Bio / Introduction"
                className="h-[90px]"
                placeholder="Tell students about your teaching style..."
                value={profileForm.bio}
                onChange={(e) => setProfileForm((f) => ({ ...f, bio: e.target.value }))}
              />
            </Card>

            <Card className="p-7 mb-5">
              <h3 className="text-base font-bold mb-4 font-sora">Education & Qualification</h3>
              <Input label="Qualification" placeholder="e.g. BSc in Mathematics, BUET" value={profileForm.qualification} onChange={(e) => setProfileForm((f) => ({ ...f, qualification: e.target.value }))} />
            </Card>

            <Card className="p-7 mb-5">
              <h3 className="text-base font-bold mb-4 font-sora">Teaching Preferences</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <Input label="Subjects (comma separated)" placeholder="Mathematics, Physics" value={profileForm.subjects} onChange={(e) => setProfileForm((f) => ({ ...f, subjects: e.target.value }))} />
                <Input label="Class Levels (comma separated)" placeholder="SSC, HSC" value={profileForm.classLevel} onChange={(e) => setProfileForm((f) => ({ ...f, classLevel: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <Input label="Location" placeholder="Dhaka" value={profileForm.location} onChange={(e) => setProfileForm((f) => ({ ...f, location: e.target.value }))} />
                <Input label="Area" placeholder="Dhanmondi, Mirpur" value={profileForm.area} onChange={(e) => setProfileForm((f) => ({ ...f, area: e.target.value }))} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <Input label="Hourly Rate (৳)" type="number" placeholder="700" value={profileForm.fee} onChange={(e) => setProfileForm((f) => ({ ...f, fee: e.target.value }))} />
                <Input label="Experience (years)" type="number" placeholder="5" value={profileForm.experience} onChange={(e) => setProfileForm((f) => ({ ...f, experience: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer mt-1">
                <input type="checkbox" checked={profileForm.online} onChange={(e) => setProfileForm((f) => ({ ...f, online: e.target.checked }))} className="w-4 h-4 accent-royal" />
                <span className="text-sm">Available for online tutoring</span>
              </label>
            </Card>

            <Button onClick={handleSaveProfile} disabled={profileSaving} size="lg">
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        )}
      </DashboardLayout>

      {/* Apply Modal */}
      <Modal
        open={!!applyModal}
        onClose={() => setApplyModal(null)}
        title={`Apply for ${applyModal?.subject || ''} Tuition`}
        footer={
          <div className="flex gap-2.5">
            <Button variant="outline" className="flex-1" onClick={() => setApplyModal(null)}>Cancel</Button>
            <Button className="flex-1" disabled={applying} onClick={submitApplication}>
              {applying ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        }
      >
        {applyModal && (
          <>
            <p className="text-[13px] text-gray-500 mb-4">{applyModal.classLevel} • {applyModal.location} • ৳{applyModal.salary}/hr</p>
            <Textarea
              label="Cover Message (optional)"
              className="h-[100px]"
              placeholder="Briefly explain why you're a good fit..."
              value={applyMsg}
              onChange={(e) => setApplyMsg(e.target.value)}
            />
          </>
        )}
      </Modal>
    </>
  );
}
