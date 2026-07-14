import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { useAuth } from '../context/AuthContext';
import { tutorAPI, messageAPI } from '../api';
import { colorFor, initialsFor, getErrorMessage } from '../utils/helpers';
import { Button, Card, Badge, Spinner, Alert, Textarea } from '../components/ui';

function Stars({ n = 5 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`text-sm ${i <= Math.floor(n) ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
      ))}
    </div>
  );
}

export default function TutorProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [tab, setTab] = useState('about');
  const [showContact, setShowContact] = useState(false);
  const [msgText, setMsgText] = useState('');
  const [msgSent, setMsgSent] = useState(false);
  const [sendError, setSendError] = useState('');
  const [sending, setSending] = useState(false);

  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await tutorAPI.getById(id);
        setProfile(res.data.profile);
        setReviews(res.data.reviews || []);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load this tutor profile.'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleSendMessage = async () => {
    if (!msgText.trim() || !profile) return;
    setSending(true);
    setSendError('');
    try {
      await messageAPI.send({ receiverId: profile.user._id, text: msgText.trim() });
      setMsgSent(true);
      setTimeout(() => { setMsgSent(false); setMsgText(''); setShowContact(false); }, 2000);
    } catch (err) {
      setSendError(getErrorMessage(err, 'Could not send message.'));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-[80vh] pt-[68px] flex flex-col items-center justify-center gap-3">
          <Spinner size="lg" />
          <p className="text-gray-400">Loading tutor profile...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (error || !profile) {
    return (
      <>
        <Navbar />
        <div className="pt-[68px] min-h-[80vh] flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">😕</div>
            <h3 className="text-lg font-bold text-gray-800 font-sora mb-1.5">Tutor not found</h3>
            <p className="text-sm text-gray-400 max-w-xs mb-4">{error || 'This tutor profile could not be loaded.'}</p>
            <Link to="/tutors" className="no-underline">
              <Button>Browse Tutors</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const name = profile.user?.name || 'Tutor';
  const color = colorFor(name);
  const initials = initialsFor(name);
  const ratingDist = [5, 4, 3, 2, 1].map((n) => {
    const count = reviews.filter((r) => r.rating === n).length;
    const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
    return { n, pct };
  });

  return (
    <>
      <Navbar />
      <div className="pt-[68px] bg-[#FDFBF7] min-h-screen">

        {/* Header band */}
        <div className="bg-gradient-to-br from-royal-dark to-royal py-12 pb-20">
          <div className="container max-w-[1200px] mx-auto px-6">
            <div className="flex items-end gap-7 flex-wrap">
              <div
                className="w-24 h-24 rounded-3xl flex items-center justify-center text-white font-bold text-3xl font-sora border-4 border-white/30"
                style={{ background: color }}
              >
                {initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white">{name}</h1>
                  {profile.verified && <Badge variant="green">✓ Verified</Badge>}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(profile.subjects || []).map((s) => (
                    <span key={s} className="px-3 py-1 rounded-full bg-white/20 text-white text-[13px] font-medium">{s}</span>
                  ))}
                </div>
                <div className="flex items-center gap-5 flex-wrap text-white/85 text-sm">
                  <div className="flex items-center gap-1.5"><Stars n={profile.ratingAvg || 0} /><span className="font-bold">{profile.ratingAvg || 0}</span><span className="opacity-70">({profile.ratingCount || 0} reviews)</span></div>
                  <div className="text-white/75">📍 {profile.location || 'N/A'}{profile.area ? `, ${profile.area}` : ''}</div>
                  <div className="text-white/75">🎓 {profile.experience || 0} yrs experience</div>
                  {profile.online && <span className="text-white/85">🌐 Online Available</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-[1200px] mx-auto px-6 -mt-10 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-7">

            {/* Main */}
            <div>
              {/* Tab nav */}
              <Card className="p-1.5 mb-6">
                <div className="flex gap-1">
                  {[['about', '📋 About'], ['reviews', '⭐ Reviews']].map(([t, l]) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        tab === t ? 'bg-royal text-white' : 'text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </Card>

              {tab === 'about' && (
                <>
                  <Card className="p-7 mb-5">
                    <h3 className="text-lg font-bold text-gray-900 font-sora mb-4">About Me</h3>
                    {profile.bio ? (
                      profile.bio.split('\n\n').map((p, i) => (
                        <p key={i} className="text-[15px] leading-relaxed text-gray-500 mb-3.5">{p}</p>
                      ))
                    ) : (
                      <p className="text-[15px] text-gray-400">This tutor hasn't added a bio yet.</p>
                    )}
                  </Card>

                  <Card className="p-7 mb-5">
                    <h3 className="text-lg font-bold text-gray-900 font-sora mb-4">Qualification</h3>
                    <p className="text-[15px] text-gray-500">{profile.qualification || 'Not provided yet.'}</p>
                  </Card>

                  <Card className="p-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      { label: 'Classes Taught', opts: profile.classLevel || [] },
                      { label: 'Teaching Areas', opts: profile.area ? [profile.area] : [] },
                    ].map(({ label, opts }) => (
                      <div key={label}>
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2.5">{label}</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {opts.length ? opts.map((o) => (
                            <span key={o} className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">{o}</span>
                          )) : <span className="text-[13px] text-gray-400">Not specified</span>}
                        </div>
                      </div>
                    ))}
                  </Card>
                </>
              )}

              {tab === 'reviews' && (
                <Card className="p-7">
                  <div className="flex items-center gap-5 mb-7 pb-6 border-b border-gray-100">
                    <div className="text-center">
                      <div className="text-5xl font-extrabold text-gray-900 font-sora leading-none">{profile.ratingAvg || 0}</div>
                      <Stars n={profile.ratingAvg || 0} />
                      <div className="text-[13px] text-gray-400 mt-1.5">{profile.ratingCount || 0} reviews</div>
                    </div>
                    <div className="flex-1">
                      {ratingDist.map(({ n, pct }) => (
                        <div key={n} className="flex items-center gap-2.5 mb-1.5">
                          <span className="text-xs text-gray-400 w-2.5">{n}</span>
                          <span className="text-xs text-amber-400">★</span>
                          <div className="flex-1 h-2 rounded bg-gray-100 overflow-hidden">
                            <div className="h-full bg-amber-400 rounded" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-gray-400 w-7">{pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {reviews.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-5">No reviews yet.</p>
                  ) : (
                    reviews.map((r, i) => {
                      const rName = r.student?.name || 'Student';
                      return (
                        <div key={r._id || i} className={`pb-5 mb-5 ${i < reviews.length - 1 ? 'border-b border-gray-50' : ''}`}>
                          <div className="flex items-center gap-3 mb-2.5">
                            <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center text-white text-[13px] font-bold font-sora" style={{ background: colorFor(rName) }}>
                              {initialsFor(rName)}
                            </div>
                            <div className="font-bold text-sm text-gray-900 font-sora">{rName}</div>
                            <div className="ml-auto"><Stars n={r.rating} /></div>
                          </div>
                          {r.comment && <p className="text-sm leading-relaxed text-gray-500">"{r.comment}"</p>}
                        </div>
                      );
                    })
                  )}
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <Card className="p-6 mb-5 lg:sticky lg:top-24">
                <div className="text-3xl font-extrabold text-royal font-sora mb-1">৳{profile.fee || 0}/hr</div>
                <div className="text-[13px] text-gray-400 mb-5">Negotiable for long-term</div>

                {user ? (
                  user._id !== profile.user?._id && (
                    <Button onClick={() => setShowContact(!showContact)} size="lg" className="w-full">💬 Send Message</Button>
                  )
                ) : (
                  <Link to="/login" className="no-underline block">
                    <Button size="lg" className="w-full">🔐 Login to Contact</Button>
                  </Link>
                )}

                {showContact && (
                  <div className="mt-3.5">
                    <Textarea
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                      placeholder={`Hi ${name.split(' ')[0]}, I'd like to hire you for...`}
                      className="h-[100px]"
                    />
                    {sendError && <Alert variant="error" className="mb-2.5">⚠️ {sendError}</Alert>}
                    {msgSent ? (
                      <Alert variant="success">✅ Message sent successfully!</Alert>
                    ) : (
                      <Button onClick={handleSendMessage} disabled={sending} variant="secondary" className="w-full">
                        {sending ? 'Sending...' : 'Send →'}
                      </Button>
                    )}
                  </div>
                )}
              </Card>

              <Card className="p-5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Quick Info</h4>
                {[
                  ['📍', 'Location', `${profile.location || 'N/A'}${profile.area ? ', ' + profile.area : ''}`],
                  ['🌐', 'Online', profile.online ? 'Available' : 'Not available'],
                ].map(([icon, label, val]) => (
                  <div key={label} className="flex gap-2 mb-2.5 text-sm">
                    <span>{icon}</span>
                    <span className="text-gray-400 min-w-[80px]">{label}:</span>
                    <span className="text-gray-800 font-medium">{val}</span>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
