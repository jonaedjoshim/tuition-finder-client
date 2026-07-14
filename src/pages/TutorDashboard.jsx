import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postAPI, tutorAPI, messageAPI, authAPI } from '../api';
import { colorFor, initialsFor, timeAgo, getErrorMessage } from '../utils/helpers';
import { Button, Card, Badge, Spinner, EmptyState, Alert, Input, Textarea } from '../components/ui';

const SIDE_LINKS = [
  { icon: '📊', label: 'Dashboard', tab: 'dashboard' },
  { icon: '💼', label: 'Browse Jobs', tab: 'jobs' },
  { icon: '📋', label: 'My Applications', tab: 'applications' },
  { icon: '📜', label: 'Tuition History', tab: 'history' },
  { icon: '💬', label: 'Messages', tab: 'messages' },
  { icon: '👤', label: 'My Profile', tab: 'profile' },
];

function StatusBadge({ status }) {
  const map = { pending: ['amber', 'Pending'], accepted: ['green', 'Accepted ✓'], rejected: ['red', 'Rejected'] };
  const [variant, label] = map[status] || ['blue', status];
  return <Badge variant={variant}>{label}</Badge>;
}

export default function TutorDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState('');

  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appsError, setAppsError] = useState('');

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');

  const [applyModal, setApplyModal] = useState(null);
  const [applyMsg, setApplyMsg] = useState('');
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState('');

  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(false);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgText, setMsgText] = useState('');

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '', phone: user?.phone || '', bio: '',
    qualification: '', experience: '', subjects: '', classLevel: '', location: '', area: '', fee: '', online: false,
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const handleLogout = () => { logout(); navigate('/'); };

  const fetchJobs = useCallback(async () => {
    setJobsLoading(true);
    setJobsError('');
    try {
      const res = await postAPI.getAll({ limit: 20 });
      setJobs(res.data.data);
    } catch (err) {
      setJobsError(getErrorMessage(err, 'Could not load jobs.'));
    } finally {
      setJobsLoading(false);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    setAppsLoading(true);
    setAppsError('');
    try {
      const res = await tutorAPI.getApplications();
      setApplications(res.data.data);
    } catch (err) {
      setAppsError(getErrorMessage(err, 'Could not load your applications.'));
    } finally {
      setAppsLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError('');
    try {
      const res = await tutorAPI.getHistory();
      setHistory(res.data.data);
    } catch (err) {
      setHistoryError(getErrorMessage(err, 'Could not load tuition history.'));
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); fetchApplications(); fetchHistory(); }, [fetchJobs, fetchApplications, fetchHistory]);

  const fetchConversations = useCallback(async () => {
    setConvLoading(true);
    try {
      const res = await messageAPI.getConversations();
      setConversations(res.data.conversations);
    } catch (err) {
      // ignore, empty state will show
    } finally {
      setConvLoading(false);
    }
  }, []);

  useEffect(() => { if (tab === 'messages') fetchConversations(); }, [tab, fetchConversations]);

  const openConversation = async (conv) => {
    setActiveConv(conv);
    setMsgLoading(true);
    try {
      const res = await messageAPI.getMessages(conv._id);
      setMessages(res.data.data);
    } catch (err) {
      setMessages([]);
    } finally {
      setMsgLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!msgText.trim() || !activeConv) return;
    try {
      await messageAPI.send({ receiverId: activeConv._id, text: msgText.trim() });
      setMsgText('');
      openConversation(activeConv);
    } catch (err) {
      // ignore
    }
  };

  const appliedPostIds = new Set(applications.map((a) => a.post?._id));

  const submitApplication = async () => {
    if (!applyModal) return;
    setApplying(true);
    setApplyError('');
    try {
      await postAPI.apply(applyModal._id, { coverMessage: applyMsg });
      setApplyModal(null);
      setApplyMsg('');
      fetchApplications();
    } catch (err) {
      setApplyError(getErrorMessage(err, 'Could not submit application.'));
    } finally {
      setApplying(false);
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileMsg('');
    try {
      await authAPI.updateProfile({ name: profileForm.name, phone: profileForm.phone, bio: profileForm.bio });
      await tutorAPI.updateProfile({
        qualification: profileForm.qualification,
        experience: profileForm.experience ? Number(profileForm.experience) : undefined,
        subjects: profileForm.subjects ? profileForm.subjects.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        classLevel: profileForm.classLevel ? profileForm.classLevel.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        location: profileForm.location,
        area: profileForm.area,
        fee: profileForm.fee ? Number(profileForm.fee) : undefined,
        online: profileForm.online,
      });
      updateUser({ name: profileForm.name, phone: profileForm.phone });
      setProfileMsg('✅ Profile updated successfully.');
    } catch (err) {
      setProfileMsg(`⚠️ ${getErrorMessage(err, 'Could not update profile.')}`);
    } finally {
      setProfileSaving(false);
    }
  };

  const pendingApps = applications.filter((a) => a.status === 'pending');
  const acceptedApps = applications.filter((a) => a.status === 'accepted');
  const availableJobs = jobs.filter((j) => !appliedPostIds.has(j._id));

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-[34px] h-[34px] rounded-lg bg-gradient-to-br from-royal to-violet flex items-center justify-center text-base">🎓</div>
          <span className="font-sora font-bold text-base text-gray-900">TuitionFinder</span>
        </Link>
      </div>

      <div className="px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-green-600 to-cyan-600 flex items-center justify-center text-white text-sm font-bold font-sora">
            {(user?.name || 'U').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 font-sora truncate">{user?.name}</div>
            <div className="text-[11px] text-gray-400">👨‍🏫 Tutor</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-2.5">
        {SIDE_LINKS.map((l) => (
          <button
            key={l.tab}
            onClick={() => setTab(l.tab)}
            className={`flex items-center gap-3 w-full px-5 py-2.5 text-sm text-left ${
              tab === l.tab ? 'bg-royal-light text-royal font-semibold' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span>{l.icon}</span>{l.label}
          </button>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-gray-100">
        <button onClick={handleLogout} className="flex items-center gap-3 w-full px-2 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg">
          <span>🚪</span>Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      <aside className="hidden lg:block w-64 border-r border-gray-100 bg-white fixed h-screen">
        <Sidebar />
      </aside>
      <main className="flex-1 lg:ml-64 p-6 md:p-10 bg-[#FDFBF7] min-h-screen">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 font-sora">
            {tab === 'dashboard' ? `Welcome back, ${user?.name?.split(' ')[0]} 👋` :
             tab === 'jobs' ? 'Browse Tuition Jobs' :
             tab === 'applications' ? 'My Applications' :
             tab === 'history' ? 'Tuition History' :
             tab === 'messages' ? 'Messages' : 'My Profile'}
          </h1>
        </div>

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
                  <button onClick={() => setTab('jobs')} className="text-xs text-royal font-semibold bg-transparent border-none cursor-pointer">View all →</button>
                </div>
                {jobsLoading ? (
                  <p className="text-[13px] text-gray-400">Loading...</p>
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
                  <button onClick={() => setTab('applications')} className="text-xs text-royal font-semibold bg-transparent border-none cursor-pointer">View all →</button>
                </div>
                {appsLoading ? (
                  <p className="text-[13px] text-gray-400">Loading...</p>
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
            {jobsLoading ? (
              <div className="flex flex-col items-center py-12 gap-3"><Spinner size="lg" /><p className="text-gray-400">Loading jobs...</p></div>
            ) : jobsError ? (
              <Alert variant="error">⚠️ {jobsError}</Alert>
            ) : jobs.length === 0 ? (
              <EmptyState icon="💼" title="No jobs available" desc="Check back later for new tuition postings." />
            ) : (
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
                          <Button onClick={() => setApplyModal(j)} size="sm">Apply Now</Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ===== APPLICATIONS ===== */}
        {tab === 'applications' && (
          <>
            {appsLoading ? (
              <div className="flex flex-col items-center py-12 gap-3"><Spinner size="lg" /><p className="text-gray-400">Loading applications...</p></div>
            ) : appsError ? (
              <Alert variant="error">⚠️ {appsError}</Alert>
            ) : applications.length === 0 ? (
              <EmptyState icon="📋" title="No applications yet" desc="Apply to tuition jobs to see them here." />
            ) : (
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}

        {/* ===== HISTORY ===== */}
        {tab === 'history' && (
          <>
            {historyLoading ? (
              <div className="flex flex-col items-center py-12 gap-3"><Spinner size="lg" /><p className="text-gray-400">Loading history...</p></div>
            ) : historyError ? (
              <Alert variant="error">⚠️ {historyError}</Alert>
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
              {convLoading ? (
                <p className="p-5 text-[13px] text-gray-400">Loading...</p>
              ) : conversations.length === 0 ? (
                <div className="p-6"><EmptyState icon="💬" title="No conversations" desc="When students contact you, they'll appear here." /></div>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => openConversation(c)}
                    className={`flex items-center gap-2.5 w-full px-4 py-3.5 border-b border-gray-50 text-left ${activeConv?._id === c._id ? 'bg-royal-light' : 'bg-white hover:bg-gray-50'}`}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: colorFor(c.user.name) }}>
                      {initialsFor(c.user.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-gray-900 truncate">{c.user.name}</div>
                      <div className="text-xs text-gray-400 truncate">{c.lastMessage?.text}</div>
                    </div>
                    {c.unreadCount > 0 && <span className="bg-royal text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{c.unreadCount}</span>}
                  </button>
                ))
              )}
            </div>

            <div className="flex flex-col">
              {!activeConv ? (
                <div className="flex-1 flex flex-col justify-center"><EmptyState icon="💬" title="Select a conversation" desc="Choose someone from the list to view messages." /></div>
              ) : (
                <>
                  <div className="px-5 py-3.5 border-b border-gray-100 font-bold font-sora">{activeConv.user.name}</div>
                  <div className="flex-1 p-5 overflow-y-auto flex flex-col gap-2.5 max-h-[340px]">
                    {msgLoading ? (
                      <p className="text-[13px] text-gray-400">Loading messages...</p>
                    ) : messages.length === 0 ? (
                      <p className="text-[13px] text-gray-400">No messages yet.</p>
                    ) : (
                      messages.map((m) => (
                        <div
                          key={m._id}
                          className={`px-3.5 py-2 rounded-2xl max-w-[70%] text-sm ${
                            m.sender === user._id ? 'self-end bg-royal text-white' : 'self-start bg-gray-100 text-gray-800'
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
            {profileMsg && <Alert variant={profileMsg.startsWith('✅') ? 'success' : 'error'} className="mb-4">{profileMsg}</Alert>}

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
      </main>

      {/* Apply Modal */}
      {applyModal && (
        <div onClick={() => setApplyModal(null)} className="fixed inset-0 bg-black/50 flex items-center justify-center p-5 z-[1000]">
          <Card onClick={(e) => e.stopPropagation()} className="p-7 max-w-md w-full">
            <h3 className="text-lg font-bold mb-1.5 font-sora">Apply for {applyModal.subject} Tuition</h3>
            <p className="text-[13px] text-gray-500 mb-4">{applyModal.classLevel} • {applyModal.location} • ৳{applyModal.salary}/hr</p>
            {applyError && <Alert variant="error" className="mb-3.5">⚠️ {applyError}</Alert>}
            <Textarea
              label="Cover Message (optional)"
              className="h-[100px]"
              placeholder="Briefly explain why you're a good fit..."
              value={applyMsg}
              onChange={(e) => setApplyMsg(e.target.value)}
            />
            <div className="flex gap-2.5">
              <Button onClick={() => setApplyModal(null)} variant="outline" className="flex-1">Cancel</Button>
              <Button onClick={submitApplication} disabled={applying} className="flex-1">
                {applying ? 'Submitting...' : 'Submit Application'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
