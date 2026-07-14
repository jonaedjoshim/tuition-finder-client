import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postAPI, applicationAPI, messageAPI, authAPI } from '../api';
import { colorFor, initialsFor, timeAgo, getErrorMessage } from '../utils/helpers';
import { Button, Card, Badge, Spinner, EmptyState, Alert, Input } from '../components/ui';

const SIDE_LINKS = [
  { icon: '📊', label: 'Dashboard', tab: 'dashboard' },
  { icon: '📝', label: 'My Posts', tab: 'posts' },
  { icon: '👥', label: 'Applications', tab: 'applications' },
  { icon: '🔍', label: 'Find Tutors', tab: null, to: '/tutors' },
  { icon: '💬', label: 'Messages', tab: 'messages' },
  { icon: '👤', label: 'Profile', tab: 'profile' },
];

function StatusBadge({ status }) {
  const map = { approved: ['green', 'Active'], pending: ['amber', 'Pending'], rejected: ['red', 'Rejected'], accepted: ['green', 'Accepted ✓'] };
  const [variant, label] = map[status] || ['blue', status];
  return <Badge variant={variant}>{label}</Badge>;
}

export default function StudentDashboard() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('dashboard');

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');

  const [applications, setApplications] = useState([]);
  const [appsLoading, setAppsLoading] = useState(true);
  const [appsError, setAppsError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(false);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgText, setMsgText] = useState('');

  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const handleLogout = () => { logout(); navigate('/'); };

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    setPostsError('');
    try {
      const res = await postAPI.getMine();
      setPosts(res.data.data);
    } catch (err) {
      setPostsError(getErrorMessage(err, 'Could not load your posts.'));
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    setAppsLoading(true);
    setAppsError('');
    try {
      const res = await applicationAPI.getMyReceived();
      setApplications(res.data.data);
    } catch (err) {
      setAppsError(getErrorMessage(err, 'Could not load applications.'));
    } finally {
      setAppsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); fetchApplications(); }, [fetchPosts, fetchApplications]);

  const fetchConversations = useCallback(async () => {
    setConvLoading(true);
    try {
      const res = await messageAPI.getConversations();
      setConversations(res.data.conversations);
    } catch (err) {
      // silently fail, empty state will show
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
      // ignore for now
    }
  };

  const handleDeletePost = async (id) => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    try {
      await postAPI.delete(id);
      setPosts(posts.filter((p) => p._id !== id));
    } catch (err) {
      alert(getErrorMessage(err, 'Could not delete post.'));
    }
  };

  const handleApplicationAction = async (id, status) => {
    setActionLoadingId(id);
    try {
      await applicationAPI.updateStatus(id, status);
      setApplications(applications.map((a) => (a._id === id ? { ...a, status } : a)));
    } catch (err) {
      alert(getErrorMessage(err, 'Could not update application.'));
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileMsg('');
    try {
      const res = await authAPI.updateProfile(profileForm);
      updateUser(res.data.user);
      setProfileMsg('✅ Profile updated successfully.');
    } catch (err) {
      setProfileMsg(`⚠️ ${getErrorMessage(err, 'Could not update profile.')}`);
    } finally {
      setProfileSaving(false);
    }
  };

  const activePosts = posts.filter((p) => p.status === 'approved');
  const pendingApps = applications.filter((a) => a.status === 'pending');
  const acceptedApps = applications.filter((a) => a.status === 'accepted');

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
          <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-royal to-violet flex items-center justify-center text-white text-sm font-bold font-sora">
            {(user?.name || 'U').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-gray-900 font-sora truncate">{user?.name}</div>
            <div className="text-[11px] text-gray-400">👨‍🎓 Student</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-2.5">
        {SIDE_LINKS.map((l) => (
          l.to ? (
            <Link key={l.label} to={l.to} className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-600 no-underline hover:bg-gray-50">
              <span>{l.icon}</span>{l.label}
            </Link>
          ) : (
            <button
              key={l.tab}
              onClick={() => setTab(l.tab)}
              className={`flex items-center gap-3 w-full px-5 py-2.5 text-sm text-left ${
                tab === l.tab ? 'bg-royal-light text-royal font-semibold' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>{l.icon}</span>{l.label}
            </button>
          )
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
        {/* Topbar */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 font-sora">
              {tab === 'dashboard' ? `Hello, ${user?.name?.split(' ')[0]} 👋` :
               tab === 'posts' ? 'My Tuition Posts' :
               tab === 'applications' ? 'Tutor Applications' :
               tab === 'messages' ? 'Messages' : 'My Profile'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{tab === 'dashboard' ? "Here's what's happening with your tutoring today." : ''}</p>
          </div>
          <Link to="/post-tuition" className="no-underline"><Button>+ Post Tuition</Button></Link>
        </div>

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
                  <button onClick={() => setTab('posts')} className="text-xs text-royal font-semibold bg-transparent border-none cursor-pointer">View all →</button>
                </div>
                {postsLoading ? (
                  <p className="text-[13px] text-gray-400">Loading...</p>
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
                  <button onClick={() => setTab('applications')} className="text-xs text-royal font-semibold bg-transparent border-none cursor-pointer">View all →</button>
                </div>
                {appsLoading ? (
                  <p className="text-[13px] text-gray-400">Loading...</p>
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
            {postsLoading ? (
              <div className="flex flex-col items-center py-12 gap-3"><Spinner size="lg" /><p className="text-gray-400">Loading posts...</p></div>
            ) : postsError ? (
              <Alert variant="error">⚠️ {postsError}</Alert>
            ) : posts.length === 0 ? (
              <EmptyState
                icon="📝"
                title="No posts yet"
                desc="Post a tuition requirement to find your perfect tutor."
                action={<Link to="/post-tuition" className="no-underline"><Button>+ Post Tuition</Button></Link>}
              />
            ) : (
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
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => setTab('applications')} variant="secondary" size="sm">View Applicants</Button>
                          <Button onClick={() => handleDeletePost(p._id)} variant="danger" size="sm">Delete</Button>
                        </div>
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
              <EmptyState icon="👥" title="No applications yet" desc="Tutors will appear here once they apply to your posts." />
            ) : (
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
                              {a.status === 'pending' && (
                                <div className="flex gap-1.5">
                                  <Button onClick={() => handleApplicationAction(a._id, 'accepted')} disabled={actionLoadingId === a._id} size="sm">Accept</Button>
                                  <Button onClick={() => handleApplicationAction(a._id, 'rejected')} disabled={actionLoadingId === a._id} variant="danger" size="sm">Reject</Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
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
                <div className="p-6"><EmptyState icon="💬" title="No conversations" desc="Message a tutor to start chatting." /></div>
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
                      <p className="text-[13px] text-gray-400">No messages yet. Say hello!</p>
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

              {profileMsg && <Alert variant={profileMsg.startsWith('✅') ? 'success' : 'error'} className="mb-4">{profileMsg}</Alert>}

              <Input label="Full Name" value={profileForm.name} onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))} />
              <Input label="Email" value={user?.email || ''} disabled />
              <Input label="Phone" value={profileForm.phone} onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))} />
              <Button onClick={handleSaveProfile} disabled={profileSaving} className="mt-2">
                {profileSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
