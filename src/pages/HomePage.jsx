import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { tutorAPI } from '../api';
import { useApi } from '../hooks/useApi';
import { SUBJECTS, LOCATIONS, CLASS_LEVELS } from '../utils/constants';
import { colorFor, initialsFor } from '../utils/helpers';
import { Button, Card, Badge, Spinner, EmptyState } from '../components/ui';

// Static category browser. Per-category tutor counts aren't exposed by the backend,
// so we show subjects to browse by without fabricating numbers.
const cats = [
  { title: 'Mathematics', emoji: '📐', bg: 'bg-blue-50' },
  { title: 'Science', emoji: '🔬', bg: 'bg-green-50' },
  { title: 'English', emoji: '📖', bg: 'bg-violet-50' },
  { title: 'Coding & IT', emoji: '💻', bg: 'bg-red-50' },
  { title: 'Commerce', emoji: '📊', bg: 'bg-amber-50' },
  { title: 'Languages', emoji: '🌍', bg: 'bg-cyan-50' },
  { title: 'Arts & Music', emoji: '🎨', bg: 'bg-pink-50' },
  { title: 'Humanities', emoji: '🏛️', bg: 'bg-emerald-50' },
];

const steps = [
  { n: '01', emoji: '🔍', title: 'Search & Filter', desc: 'Browse tutors by subject, location, class level, and budget. Smart filters help you narrow down the perfect match.', bg: 'bg-blue-50' },
  { n: '02', emoji: '👤', title: 'Review Profiles', desc: 'Read detailed profiles, qualifications, student reviews to choose the tutor that perfectly fits your needs.', bg: 'bg-violet-50' },
  { n: '03', emoji: '📅', title: 'Book a Session', desc: 'Schedule your first class at a convenient time. Choose home visits, student visits, or live online sessions.', bg: 'bg-green-50' },
  { n: '04', emoji: '🚀', title: 'Start Learning', desc: 'Enjoy personalized one-on-one teaching. Track progress, give feedback, and watch your grades soar.', bg: 'bg-amber-50' },
];

function Stars({ n = 5 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`text-sm ${i <= Math.floor(n) ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [sub, setSub] = useState('');
  const [loc, setLoc] = useState('');
  const [cls, setCls] = useState('');
  const navigate = useNavigate();

  const featured = useApi(() => tutorAPI.getAll({ sort: 'rating', limit: 6 }), []);
  // useApi stores the raw axios response: response.data is the API envelope.
  const body = featured.data?.data ?? featured.data;
  const featuredTutors = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
  const totalTutors = body?.pagination?.total ?? null;

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (sub) params.set('subject', sub);
    if (loc) params.set('location', loc);
    if (cls) params.set('classLevel', cls);
    navigate(`/tutors?${params.toString()}`);
  };

  return (
    <>
      <Navbar />

      {/* ===== HERO ===== */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-blue-50/60 to-[#FDFBF7] relative overflow-hidden">
        <div className="container max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-royal text-sm font-medium mb-6">
              ⭐ Connecting students with verified tutors across Bangladesh
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight mb-5 font-sora">
              Find Your Perfect <span className="text-royal">Tutor</span> Today
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed mb-8 max-w-lg">
              Connect with verified, experienced tutors across Bangladesh. Personalized learning, flexible scheduling, proven results.
            </p>

            {/* Search bar */}
            <Card className="p-4 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <select value={sub} onChange={(e) => setSub(e.target.value)} className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-royal">
                  <option value="">Any Subject</option>
                  {(SUBJECTS || []).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={loc} onChange={(e) => setLoc(e.target.value)} className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-royal">
                  <option value="">Any Location</option>
                  {(LOCATIONS || []).map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <select value={cls} onChange={(e) => setCls(e.target.value)} className="px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-royal">
                  <option value="">Any Class</option>
                  {(CLASS_LEVELS || []).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Button onClick={handleSearch} size="lg" className="w-full mt-3">🔍 Search Tutors</Button>
            </Card>

            {/* Stats */}
            <div className="flex gap-10 flex-wrap">
              <div>
                <div className="text-2xl font-extrabold text-royal font-sora">{totalTutors !== null ? `${totalTutors}+` : '—'}</div>
                <div className="text-sm text-gray-400 mt-0.5">Expert Tutors</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-royal font-sora">✓</div>
                <div className="text-sm text-gray-400 mt-0.5">Verified Profiles</div>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="aspect-square max-w-md mx-auto rounded-3xl bg-gradient-to-br from-royal/10 to-violet/10 flex items-center justify-center text-8xl">
              🎓
            </div>
            <Card className="absolute bottom-[-18px] right-[-20px] px-4 py-3 flex items-center gap-2.5">
              <div className="text-2xl">⭐</div>
              <div>
                <div className="text-sm font-bold text-gray-900 font-sora">Verified Tutors</div>
                <div className="text-xs text-gray-400">Real student reviews</div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="py-20">
        <div className="container max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <Badge variant="blue" className="mb-4">📚 Browse by Subject</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 font-sora tracking-tight">
              Find Tutors in <span className="text-royal">Every Subject</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {cats.map((c) => (
              <Link key={c.title} to={`/tutors?subject=${encodeURIComponent(c.title)}`} className="no-underline">
                <Card hover className="p-5 cursor-pointer h-full">
                  <div className={`w-14 h-14 rounded-2xl ${c.bg} flex items-center justify-center text-2xl mb-4`}>{c.emoji}</div>
                  <h3 className="font-bold text-sm text-gray-900 mb-1">{c.title}</h3>
                  <p className="text-xs text-gray-400 mb-3">Browse tutors</p>
                  <div className="h-[3px] w-8 rounded bg-royal" />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURED TUTORS ===== */}
      <section className="py-20 bg-white">
        <div className="container max-w-[1200px] mx-auto px-6">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-12">
            <div>
              <Badge variant="violet" className="mb-4">🌟 Top Rated</Badge>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 font-sora tracking-tight">Featured Tutors</h2>
            </div>
            <Link to="/tutors" className="no-underline">
              <Button variant="secondary">View All Tutors →</Button>
            </Link>
          </div>

          {featured.loading ? (
            <div className="flex flex-col items-center py-16 gap-3"><Spinner size="lg" /><p className="text-gray-400">Loading tutors...</p></div>
          ) : featuredTutors.length === 0 ? (
            <EmptyState icon="🌟" title="No tutors yet" desc="Be the first to join as a tutor!" />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTutors.map((t) => {
                const name = t.user?.name || 'Tutor';
                const color = colorFor(name);
                const initials = initialsFor(name);
                return (
                  <Card key={t._id} hover className="overflow-hidden">
                    <div className="h-1.5" style={{ background: color }} />
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-white font-bold text-base font-sora flex-shrink-0" style={{ background: color }}>
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-[15px] text-gray-900 font-sora">{name}</div>
                            <div className="text-xs text-gray-400 mt-0.5">{t.experience || 0} yrs experience</div>
                          </div>
                        </div>
                        {t.verified && <Badge variant="green">✓ Verified</Badge>}
                      </div>

                      <div className="flex items-center gap-2 mb-2.5">
                        <span>📖</span>
                        <span className="text-sm font-semibold text-gray-800">{(t.subjects || []).join(', ') || 'Subjects not set'}</span>
                      </div>

                      <div className="flex items-center justify-between mb-3.5">
                        <div className="flex items-center gap-1.5 text-[13px] text-gray-400"><span>📍</span>{t.location || 'N/A'}</div>
                        {t.online && <Badge variant="green">Online ✓</Badge>}
                      </div>

                      <div className="border-t border-gray-100 pt-3.5">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <Stars n={t.ratingAvg || 0} />
                              <span className="text-[13px] font-bold text-gray-900">{t.ratingAvg || 0}</span>
                            </div>
                            <span className="text-xs text-gray-400">({t.ratingCount || 0} reviews)</span>
                          </div>
                          <div className="text-xl font-extrabold font-sora" style={{ color }}>৳{t.fee || 0}/hr</div>
                        </div>
                        <Link to={`/tutors/${t._id}`} className="no-underline block">
                          <Button variant="secondary" className="w-full">👤 View Profile</Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section id="how" className="py-20">
        <div className="container max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-14">
            <Badge variant="blue" className="mb-4">⚡ Simple Process</Badge>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 font-sora tracking-tight">How It Works</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.n} className="text-center">
                <div className={`w-20 h-20 rounded-3xl ${s.bg} flex items-center justify-center text-3xl mx-auto mb-5`}>{s.emoji}</div>
                <div className="text-xs font-bold text-gray-300 font-sora mb-1.5">STEP {s.n}</div>
                <h3 className="text-lg font-bold text-gray-900 font-sora mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== BECOME A TUTOR CTA ===== */}
      <section className="py-20 bg-white">
        <div className="container max-w-[1200px] mx-auto px-6">
          <Card className="overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="p-10 md:p-14 flex flex-col justify-center">
                <Badge variant="green" className="mb-4 w-fit">💼 For Educators</Badge>
                <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 font-sora mb-4 leading-tight">
                  Turn Your Knowledge Into Income
                </h2>
                <p className="text-[15px] leading-relaxed text-gray-500 mb-6">
                  Join educators teaching subjects they love. Set your own rates, choose your students, teach from anywhere.
                </p>
                <Link to="/register?role=tutor" className="no-underline w-fit">
                  <Button size="lg">🚀 Register as Tutor</Button>
                </Link>
              </div>
              <div className="bg-gradient-to-br from-blue-50/60 to-violet-50/80 flex items-center justify-center p-10 min-h-[260px]">
                <div className="text-center">
                  <div className="text-7xl mb-4">🎓</div>
                  <div className="text-lg font-bold text-royal font-sora">Set Your Own Rate</div>
                  <div className="text-sm text-gray-500 mt-1">You decide what you charge per hour</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-24 bg-gradient-to-br from-royal-dark via-royal to-violet text-center">
        <div className="container max-w-[1200px] mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white font-sora mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-white/75 mb-9 max-w-lg mx-auto">Register free and find your perfect tutor today.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to="/register" className="no-underline">
              <Button variant="outline" size="lg" className="!bg-white !text-royal !border-white">Get Started Free</Button>
            </Link>
            <Link to="/tutors" className="no-underline">
              <Button variant="outline" size="lg" className="!bg-transparent !text-white !border-white/40">Browse Tutors</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
