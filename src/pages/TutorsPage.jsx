import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import { tutorAPI } from '../api';
import { useApi } from '../hooks/useApi';
import { SUBJECTS, LOCATIONS, CLASS_LEVELS } from '../utils/constants';
import { colorFor, initialsFor, getErrorMessage } from '../utils/helpers';
import { Button, Card, Badge, Spinner, EmptyState, Alert } from '../components/ui';

const subjectOptions = Array.isArray(SUBJECTS) ? SUBJECTS : [];
const locationOptions = Array.isArray(LOCATIONS) ? LOCATIONS : [];
const classOptions = Array.isArray(CLASS_LEVELS) ? CLASS_LEVELS : [];

// Keep a legacy/unknown URL value visible so the active chip always matches the query.
const withExtra = (opts, value) => (value && value !== 'All' && !opts.includes(value) ? [value, ...opts] : opts);

function Stars({ n = 5 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`text-xs ${i <= Math.floor(n) ? 'text-amber-400' : 'text-gray-300'}`}>★</span>
      ))}
    </div>
  );
}

export default function TutorsPage() {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.toString();

  const [filters, setFilters] = useState({
    location: searchParams.get('location') || 'All',
    subject: searchParams.get('subject') || 'All',
    // `class` is accepted as a legacy alias for `classLevel`.
    classLevel: searchParams.get('classLevel') || searchParams.get('class') || 'All',
    minFee: '',
    maxFee: '',
    onlineOnly: false,
    verifiedOnly: false,
    search: searchParams.get('search') || '',
    sort: 'rating',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  // Re-sync when the URL changes (e.g. clicking a category link while already on /tutors).
  useEffect(() => {
    const sp = new URLSearchParams(searchQuery);
    setFilters((f) => ({
      ...f,
      location: sp.get('location') || 'All',
      subject: sp.get('subject') || 'All',
      classLevel: sp.get('classLevel') || sp.get('class') || 'All',
      search: sp.get('search') || '',
    }));
    setPage(1);
  }, [searchQuery]);

  const setF = (k, v) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1); };

  const tutorsApi = useApi(() => {
    const sortMap = { rating: 'rating', reviews: 'rating', fee_low: 'fee_asc', fee_high: 'fee_desc' };
    const params = { page, limit: 10, sort: sortMap[filters.sort] || 'rating' };
    if (filters.subject !== 'All') params.subject = filters.subject;
    if (filters.location !== 'All') params.location = filters.location;
    if (filters.classLevel !== 'All') params.classLevel = filters.classLevel;
    if (filters.minFee) params.minFee = filters.minFee;
    if (filters.maxFee) params.maxFee = filters.maxFee;
    if (filters.onlineOnly) params.online = true;
    if (filters.verifiedOnly) params.verified = true;
    // Server-side free-text search over tutor name / subjects.
    if (filters.search.trim()) params.search = filters.search.trim();
    return tutorAPI.getAll(params);
  }, [page, filters]);

  // useApi keeps the raw axios response; response.data is the API envelope.
  const body = tutorsApi.data?.data ?? tutorsApi.data;
  const tutors = Array.isArray(body?.data) ? body.data : Array.isArray(body) ? body : [];
  const pagination = body?.pagination || { total: 0, page: 1, totalPages: 1 };
  const errorMessage = typeof tutorsApi.error === 'string'
    ? tutorsApi.error
    : getErrorMessage(tutorsApi.error, 'Could not load tutors. Please try again.');

  const FilterPanel = () => (
    <Card className="p-6 sticky top-24">
      <h3 className="text-base font-bold text-gray-900 font-sora mb-5">Filters</h3>

      {[
        { label: 'Location', key: 'location', opts: withExtra(locationOptions, filters.location) },
        { label: 'Subject', key: 'subject', opts: withExtra(subjectOptions, filters.subject) },
        { label: 'Class Level', key: 'classLevel', opts: withExtra(classOptions, filters.classLevel) },
      ].map(({ label, key, opts }) => (
        <div key={key} className="mb-5">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">{label}</label>
          <div className="flex flex-wrap gap-1.5">
            {['All', ...opts.filter((o) => o !== 'All')].map((opt) => (
              <button
                key={opt}
                onClick={() => setF(key, opt)}
                className={`px-3 py-1 rounded-full text-xs font-medium border-[1.5px] transition-colors ${
                  filters[key] === opt ? 'border-royal bg-royal-light text-royal' : 'border-gray-200 text-gray-500'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="mb-5">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide block mb-2">Fee Range (৳/hr)</label>
        <div className="flex gap-2">
          <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-royal" placeholder="Min" value={filters.minFee} onChange={(e) => setF('minFee', e.target.value)} />
          <input className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-royal" placeholder="Max" value={filters.maxFee} onChange={(e) => setF('maxFee', e.target.value)} />
        </div>
      </div>

      {[
        { key: 'onlineOnly', label: 'Online tutors only' },
        { key: 'verifiedOnly', label: 'Verified tutors only' },
      ].map(({ key, label }) => (
        <label key={key} className="flex items-center gap-2.5 cursor-pointer mb-3">
          <input type="checkbox" checked={filters[key]} onChange={(e) => setF(key, e.target.checked)} className="w-4 h-4 accent-royal cursor-pointer" />
          <span className="text-sm text-gray-800">{label}</span>
        </label>
      ))}

      <Button
        onClick={() => { setFilters({ location: 'All', subject: 'All', classLevel: 'All', minFee: '', maxFee: '', onlineOnly: false, verifiedOnly: false, search: '', sort: 'rating' }); setPage(1); }}
        variant="outline"
        className="w-full mt-3"
      >
        Clear All Filters
      </Button>
    </Card>
  );

  return (
    <>
      <Navbar />
      <div className="pt-[68px] bg-[#FDFBF7] min-h-screen">

        {/* Hero */}
        <div className="bg-gradient-to-br from-royal-dark to-royal py-12 pb-14">
          <div className="container max-w-[1200px] mx-auto px-6">
            <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2.5">Find Your Perfect Tutor</h1>
            <p className="text-base text-white/75 mb-7">{pagination.total || 0}+ verified tutors across Bangladesh</p>
            <div className="flex gap-3 max-w-2xl flex-wrap">
              <div className="flex-1 min-w-[200px] flex items-center gap-2.5 bg-white/15 border-[1.5px] border-white/30 rounded-xl px-4 py-3">
                <span className="text-lg">🔍</span>
                <input
                  placeholder="Search tutor or subject..."
                  value={filters.search}
                  onChange={(e) => setF('search', e.target.value)}
                  className="bg-transparent border-none outline-none text-[15px] text-white w-full placeholder:text-white/60"
                />
              </div>
              <select
                value={filters.sort}
                onChange={(e) => setF('sort', e.target.value)}
                className="px-4 py-3 rounded-xl border-[1.5px] border-white/30 bg-white/15 text-white text-sm cursor-pointer outline-none"
              >
                <option value="rating" className="text-black">Sort: Top Rated</option>
                <option value="reviews" className="text-black">Sort: Most Reviews</option>
                <option value="fee_low" className="text-black">Sort: Fee Low→High</option>
                <option value="fee_high" className="text-black">Sort: Fee High→Low</option>
              </select>
            </div>
          </div>
        </div>

        <div className="container max-w-[1200px] mx-auto px-6 pt-10 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-8">

            {/* Sidebar filters */}
            <div className="hidden md:block">
              <FilterPanel />
            </div>

            {/* Results */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <p className="text-[15px] text-gray-500">
                  <span className="font-bold text-gray-900">{pagination.total || 0}</span> tutors found
                </p>
                <Button onClick={() => setShowFilters(!showFilters)} variant="outline" size="sm" className="md:hidden">
                  🔧 Filters
                </Button>
              </div>

              {showFilters && <div className="md:hidden mb-6"><FilterPanel /></div>}

              {tutorsApi.loading ? (
                <div className="flex flex-col items-center py-16 gap-3"><Spinner size="lg" /><p className="text-gray-400">Loading tutors...</p></div>
              ) : tutorsApi.error ? (
                <Alert variant="error">⚠️ {errorMessage}</Alert>
              ) : tutors.length === 0 ? (
                <EmptyState icon="🔍" title="No tutors found" desc="Try adjusting your filters or search query." />
              ) : (
                <>
                  <div className="flex flex-col gap-4">
                    {tutors.map((t) => {
                      const name = t.user?.name || 'Tutor';
                      const color = colorFor(name);
                      const initials = initialsFor(name);
                      return (
                        <Card key={t._id} hover className="p-6 flex gap-5 flex-col sm:flex-row">
                          {/* Avatar */}
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl font-sora" style={{ background: color }}>
                              {initials}
                            </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-[17px] font-bold text-gray-900 font-sora">{name}</h3>
                                  {t.verified && <Badge variant="green">✓ Verified</Badge>}
                                </div>
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {(t.subjects || []).map((s) => (
                                    <span key={s} className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">{s}</span>
                                  ))}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className="text-xl font-extrabold text-royal font-sora">৳{t.fee || 0}/hr</div>
                                <div className="text-xs text-gray-400 mt-0.5">{t.experience || 0} yrs exp.</div>
                              </div>
                            </div>

                            {t.bio && <p className="text-sm text-gray-500 my-2.5 leading-relaxed line-clamp-2">{t.bio}</p>}

                            <div className="flex items-center justify-between flex-wrap gap-2.5 mt-2">
                              <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-1.5">
                                  <Stars n={t.ratingAvg || 0} />
                                  <span className="text-[13px] font-bold text-gray-900">{t.ratingAvg || 0}</span>
                                  <span className="text-xs text-gray-400">({t.ratingCount || 0})</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[13px] text-gray-400"><span>📍</span>{t.location || 'N/A'}{t.area ? `, ${t.area}` : ''}</div>
                                {t.online && <Badge variant="green">Online ✓</Badge>}
                              </div>
                              <Link to={`/tutors/${t._id}`} className="no-underline">
                                <Button size="sm">View Profile →</Button>
                              </Link>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                      <Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} variant="outline" size="sm">← Prev</Button>
                      <span className="flex items-center text-sm text-gray-500 px-2.5">Page {pagination.page || page} of {pagination.totalPages}</span>
                      <Button disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} variant="outline" size="sm">Next →</Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
