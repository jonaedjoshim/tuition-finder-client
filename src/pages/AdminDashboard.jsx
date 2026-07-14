import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI, tutorAPI } from '../api';
import { timeAgo, getErrorMessage } from '../utils/helpers';
import { Button, Card, Badge, Spinner, EmptyState, Alert } from '../components/ui';

const SIDE_LINKS = [
  { icon: '📊', label: 'Overview', tab: 'overview' },
  { icon: '👥', label: 'User Management', tab: 'users' },
  { icon: '📝', label: 'Post Approvals', tab: 'posts' },
  { icon: '✅', label: 'Tutor Verification', tab: 'verification' },
  { icon: '🚩', label: 'Reports', tab: 'reports' },
];

function StatusBadge({ status }) {
  const map = {
    active: ['green', 'Active'], pending: ['amber', 'Pending'], suspended: ['red', 'Suspended'],
    approved: ['green', 'Approved'], rejected: ['red', 'Rejected'], open: ['amber', 'Open'], resolved: ['green', 'Resolved'],
  };
  const [variant, label] = map[status] || ['blue', status];
  return <Badge variant={variant}>{label}</Badge>;
}

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [userActionId, setUserActionId] = useState(null);

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState('');
  const [postActionId, setPostActionId] = useState(null);

  const [unverifiedTutors, setUnverifiedTutors] = useState([]);
  const [tutorsLoading, setTutorsLoading] = useState(true);
  const [tutorsError, setTutorsError] = useState('');
  const [verifyActionId, setVerifyActionId] = useState(null);

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState('');
  const [reportActionId, setReportActionId] = useState(null);

  const handleLogout = () => { logout(); navigate('/'); };

  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const res = await adminAPI.getStats();
      setStats(res.data);
    } catch (err) {
      // leave stats null, overview will show an error
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    setUsersError('');
    try {
      const params = {};
      if (userFilter !== 'all') params.role = userFilter;
      const res = await adminAPI.getUsers(params);
      setUsers(res.data.data);
    } catch (err) {
      setUsersError(getErrorMessage(err, 'Could not load users.'));
    } finally {
      setUsersLoading(false);
    }
  }, [userFilter]);

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    setPostsError('');
    try {
      const res = await adminAPI.getPosts();
      setPosts(res.data.data);
    } catch (err) {
      setPostsError(getErrorMessage(err, 'Could not load posts.'));
    } finally {
      setPostsLoading(false);
    }
  }, []);

  const fetchUnverifiedTutors = useCallback(async () => {
    setTutorsLoading(true);
    setTutorsError('');
    try {
      const res = await tutorAPI.getAll({ verified: false, limit: 50 });
      setUnverifiedTutors(res.data.data);
    } catch (err) {
      setTutorsError(getErrorMessage(err, 'Could not load tutor profiles.'));
    } finally {
      setTutorsLoading(false);
    }
  }, []);

  const fetchReports = useCallback(async () => {
    setReportsLoading(true);
    setReportsError('');
    try {
      const res = await adminAPI.getReports();
      setReports(res.data.data);
    } catch (err) {
      setReportsError(getErrorMessage(err, 'Could not load reports.'));
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchPosts();
    fetchUnverifiedTutors();
    fetchReports();
  }, [fetchStats, fetchPosts, fetchUnverifiedTutors, fetchReports]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleUserStatus = async (id, status) => {
    setUserActionId(id);
    try {
      await adminAPI.updateUserStatus(id, status);
      setUsers(users.map((u) => (u._id === id ? { ...u, status } : u)));
    } catch (err) {
      alert(getErrorMessage(err, 'Could not update user status.'));
    } finally {
      setUserActionId(null);
    }
  };

  const handlePostStatus = async (id, action) => {
    setPostActionId(id);
    try {
      if (action === 'approved') await adminAPI.approvePost(id);
      else await adminAPI.rejectPost(id);
      setPosts(posts.map((p) => (p._id === id ? { ...p, status: action } : p)));
    } catch (err) {
      alert(getErrorMessage(err, 'Could not update post status.'));
    } finally {
      setPostActionId(null);
    }
  };

  const handleVerify = async (profileId) => {
    setVerifyActionId(profileId);
    try {
      await adminAPI.verifyTutor(profileId);
      setUnverifiedTutors(unverifiedTutors.filter((t) => t._id !== profileId));
    } catch (err) {
      alert(getErrorMessage(err, 'Could not verify tutor.'));
    } finally {
      setVerifyActionId(null);
    }
  };

  const handleResolveReport = async (id) => {
    setReportActionId(id);
    try {
      await adminAPI.resolveReport(id);
      setReports(reports.map((r) => (r._id === id ? { ...r, status: 'resolved' } : r)));
    } catch (err) {
      alert(getErrorMessage(err, 'Could not resolve report.'));
    } finally {
      setReportActionId(null);
    }
  };

  const pendingPosts = posts.filter((p) => p.status === 'pending');
  const openReports = reports.filter((r) => r.status === 'open');

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
          <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-gray-800 to-royal flex items-center justify-center text-white text-sm font-bold font-sora">
            {(user?.name || 'A').slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900 font-sora">{user?.name}</div>
            <div className="text-[11px] text-gray-400">⚙️ Admin</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-2.5">
        {SIDE_LINKS.map((l) => {
          const badgeCount = l.tab === 'posts' ? pendingPosts.length : l.tab === 'verification' ? unverifiedTutors.length : l.tab === 'reports' ? openReports.length : 0;
          return (
            <button
              key={l.tab}
              onClick={() => setTab(l.tab)}
              className={`flex items-center justify-between w-full px-5 py-2.5 text-sm text-left ${
                tab === l.tab ? 'bg-royal-light text-royal font-semibold' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-3"><span>{l.icon}</span>{l.label}</span>
              {badgeCount > 0 && <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{badgeCount}</span>}
            </button>
          );
        })}
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
            {tab === 'overview' ? 'Admin Overview' :
             tab === 'users' ? 'User Management' :
             tab === 'posts' ? 'Tuition Post Approvals' :
             tab === 'verification' ? 'Tutor Verification' : 'Reports & Complaints'}
          </h1>
        </div>

        {/* ===== OVERVIEW ===== */}
        {tab === 'overview' && (
          <>
            {statsLoading ? (
              <div className="flex flex-col items-center py-12 gap-3"><Spinner size="lg" /><p className="text-gray-400">Loading stats...</p></div>
            ) : !stats ? (
              <Alert variant="error">⚠️ Could not load dashboard stats.</Alert>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
                  {[
                    { icon: '👥', label: 'Total Users', value: stats.totalUsers, color: 'text-royal' },
                    { icon: '📝', label: 'Pending Posts', value: stats.pendingPosts, color: 'text-amber-600' },
                    { icon: '✅', label: 'Pending Verification', value: stats.pendingVerifications, color: 'text-violet' },
                    { icon: '🚩', label: 'Open Reports', value: stats.openReports, color: 'text-red-600' },
                  ].map((s) => (
                    <Card key={s.label} className="p-5">
                      <div className="text-2xl mb-3">{s.icon}</div>
                      <div className={`text-2xl font-extrabold font-sora ${s.color}`}>{s.value}</div>
                      <div className="text-sm text-gray-400 mt-0.5">{s.label}</div>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  <Card className="p-6">
                    <h3 className="text-base font-bold mb-4 font-sora">User Breakdown</h3>
                    {[
                      ['Students', stats.totalStudents, 'text-royal'],
                      ['Tutors', stats.totalTutors, 'text-violet'],
                    ].map(([label, val, color]) => (
                      <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                        <span className="text-sm text-gray-500">{label}</span>
                        <span className={`text-base font-bold font-sora ${color}`}>{val}</span>
                      </div>
                    ))}
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-base font-bold mb-4 font-sora">Needs Your Attention</h3>
                    <div className="flex flex-col gap-2.5">
                      <button onClick={() => setTab('posts')} className="w-full text-left">
                        <Alert variant="warning" className="cursor-pointer justify-between">
                          <span>📝 {stats.pendingPosts} posts awaiting approval</span><span>→</span>
                        </Alert>
                      </button>
                      <button onClick={() => setTab('verification')} className="w-full text-left">
                        <Alert variant="info" className="cursor-pointer justify-between">
                          <span>✅ {stats.pendingVerifications} tutors need verification</span><span>→</span>
                        </Alert>
                      </button>
                      <button onClick={() => setTab('reports')} className="w-full text-left">
                        <Alert variant="error" className="cursor-pointer justify-between">
                          <span>🚩 {stats.openReports} open reports</span><span>→</span>
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
        {tab === 'users' && (
          <>
            <div className="flex gap-1.5 mb-5 max-w-[360px]">
              {['all', 'student', 'tutor'].map((f) => (
                <button
                  key={f}
                  onClick={() => setUserFilter(f)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${
                    userFilter === f ? 'bg-royal text-white' : 'bg-white text-gray-500 border border-gray-200'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            {usersLoading ? (
              <div className="flex flex-col items-center py-12 gap-3"><Spinner size="lg" /><p className="text-gray-400">Loading users...</p></div>
            ) : usersError ? (
              <Alert variant="error">⚠️ {usersError}</Alert>
            ) : (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left text-xs text-gray-400 uppercase tracking-wide">
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
                        <tr key={u._id} className="border-t border-gray-50">
                          <td className="px-5 py-3.5 font-semibold">{u.name}</td>
                          <td className="px-5 py-3.5 text-gray-400">{u.email}</td>
                          <td className="px-5 py-3.5"><span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs capitalize">{u.role}</span></td>
                          <td className="px-5 py-3.5 text-gray-400">{timeAgo(u.createdAt)}</td>
                          <td className="px-5 py-3.5"><StatusBadge status={u.status} /></td>
                          <td className="px-5 py-3.5">
                            {u.status !== 'suspended' ? (
                              <Button onClick={() => handleUserStatus(u._id, 'suspended')} disabled={userActionId === u._id} variant="danger" size="sm">Suspend</Button>
                            ) : (
                              <Button onClick={() => handleUserStatus(u._id, 'active')} disabled={userActionId === u._id} variant="secondary" size="sm">Reinstate</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}

        {/* ===== POST APPROVALS ===== */}
        {tab === 'posts' && (
          <>
            {postsLoading ? (
              <div className="flex flex-col items-center py-12 gap-3"><Spinner size="lg" /><p className="text-gray-400">Loading posts...</p></div>
            ) : postsError ? (
              <Alert variant="error">⚠️ {postsError}</Alert>
            ) : posts.length === 0 ? (
              <EmptyState icon="📝" title="No posts yet" desc="Tuition posts submitted by students will appear here." />
            ) : (
              <div className="flex flex-col gap-4">
                {posts.map((p) => (
                  <Card key={p._id} className="p-6">
                    <div className="flex items-start justify-between flex-wrap gap-3">
                      <div>
                        <div className="flex items-center gap-2.5 mb-2">
                          <h3 className="text-base font-bold font-sora">{p.subject} — {p.classLevel}</h3>
                          <StatusBadge status={p.status} />
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span>📍 {p.location}</span>
                          <span>💰 ৳{p.salary}/hr</span>
                          <span>👤 {p.postedBy?.name || 'Unknown'}</span>
                          <span>🕒 {timeAgo(p.createdAt)}</span>
                        </div>
                      </div>
                      {p.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button onClick={() => handlePostStatus(p._id, 'approved')} disabled={postActionId === p._id} size="sm">✓ Approve</Button>
                          <Button onClick={() => handlePostStatus(p._id, 'rejected')} disabled={postActionId === p._id} variant="danger" size="sm">✕ Reject</Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== VERIFICATION ===== */}
        {tab === 'verification' && (
          <>
            {tutorsLoading ? (
              <div className="flex flex-col items-center py-12 gap-3"><Spinner size="lg" /><p className="text-gray-400">Loading tutor profiles...</p></div>
            ) : tutorsError ? (
              <Alert variant="error">⚠️ {tutorsError}</Alert>
            ) : unverifiedTutors.length === 0 ? (
              <EmptyState icon="✅" title="All caught up" desc="No tutors are currently pending verification." />
            ) : (
              <div className="flex flex-col gap-4">
                {unverifiedTutors.map((t) => (
                  <Card key={t._id} className="p-6 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-royal flex items-center justify-center text-white font-bold font-sora">
                        {(t.user?.name || 'TU').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold font-sora">{t.user?.name || 'Unknown Tutor'}</div>
                        <div className="text-[13px] text-gray-400">{t.user?.email} • {(t.documents || []).length} document(s) uploaded</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {(t.documents || []).length > 0 && (
                        <a
                          href={`${import.meta.env.VITE_API_URL.replace('/api', '')}${t.documents[0]}`}
                          target="_blank"
                          rel="noreferrer"
                          className="no-underline"
                        >
                          <Button variant="outline" size="sm">View Documents</Button>
                        </a>
                      )}
                      <Button onClick={() => handleVerify(t._id)} disabled={verifyActionId === t._id} size="sm">✓ Verify</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== REPORTS ===== */}
        {tab === 'reports' && (
          <>
            {reportsLoading ? (
              <div className="flex flex-col items-center py-12 gap-3"><Spinner size="lg" /><p className="text-gray-400">Loading reports...</p></div>
            ) : reportsError ? (
              <Alert variant="error">⚠️ {reportsError}</Alert>
            ) : reports.length === 0 ? (
              <EmptyState icon="🚩" title="No reports" desc="User-submitted reports and complaints will appear here." />
            ) : (
              <div className="flex flex-col gap-4">
                {reports.map((r) => (
                  <Card key={r._id} className="p-6">
                    <div className="flex items-start justify-between flex-wrap gap-3 mb-2.5">
                      <div>
                        <div className="mb-1.5"><StatusBadge status={r.status} /></div>
                        <h3 className="text-[15px] font-bold font-sora">Against: {r.against?.name || 'Unknown'}</h3>
                      </div>
                      {r.status === 'open' && (
                        <Button onClick={() => handleResolveReport(r._id)} disabled={reportActionId === r._id} size="sm">Mark Resolved</Button>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed mb-2">{r.reason}</p>
                    <div className="text-xs text-gray-400">Reported by {r.reportedBy?.name || 'Unknown'} • {timeAgo(r.createdAt)}</div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
