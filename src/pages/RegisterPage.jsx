import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Alert } from '../components/ui';

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const defaultRole = params.get('role') || 'student';

  const [role, setRole] = useState(defaultRole);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const friendlyFirebaseError = (err) => {
    const code = err?.code || '';
    if (code.includes('email-already-in-use')) return 'An account with this email already exists.';
    if (code.includes('weak-password')) return 'Password is too weak. Use at least 6 characters.';
    if (code.includes('invalid-email')) return 'Please enter a valid email address.';
    return err?.response?.data?.message || 'Registration failed. Please try again.';
  };

  const handleRegister = async () => {
    setError('');
    if (!form.name || !form.email || !form.password) return setError('Please fill in all required fields.');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);

    try {
      const { confirmPassword, ...payload } = form;
      const userData = await register({ ...payload, role });
      navigate(role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(friendlyFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const userData = await loginWithGoogle(role);
      navigate(userData.role === 'tutor' ? '/tutor/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(friendlyFirebaseError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[#FDFBF7]">
      {/* Left */}
      <div className="hidden md:flex flex-col justify-center items-center p-16 relative overflow-hidden bg-gradient-to-br from-green-600 via-teal-600 to-cyan-600">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/[0.06]" />
        <Link to="/" className="flex items-center gap-3 no-underline mb-16 relative z-10">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-xl">🎓</div>
          <span className="font-sora font-bold text-xl text-white">TuitionFinder</span>
        </Link>

        <div className="text-center max-w-sm relative z-10">
          <div className="text-7xl mb-7">{role === 'tutor' ? '👨‍🏫' : '👨‍🎓'}</div>
          <h2 className="text-2xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
            {role === 'tutor' ? 'Share Your Knowledge' : 'Start Your Journey'}
          </h2>
          <p className="text-sm text-white/75 leading-relaxed">
            {role === 'tutor'
              ? 'Join thousands of tutors teaching subjects they love on their own schedule.'
              : 'Connect with verified expert tutors and achieve your academic goals today.'}
          </p>

          <div className="mt-10 flex flex-col gap-3">
            {(role === 'tutor'
              ? ['✅ Free to register', '✅ Flexible hours', '✅ Verified badge', '✅ Direct messaging']
              : ['🎯 Find the right tutor fast', '🔒 Verified & safe profiles', '💬 Direct messaging', '⭐ Review & rate tutors']
            ).map((t) => (
              <div key={t} className="flex items-center gap-2.5 bg-white/[0.12] rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/90">
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-col justify-center items-center px-6 md:px-12 py-10 overflow-y-auto">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-extrabold text-gray-900 font-sora mb-2">Create Account</h1>
          <p className="text-sm text-gray-500 mb-6">
            Already registered?{' '}
            <Link to="/login" className="text-royal font-semibold no-underline">Sign in →</Link>
          </p>

          {/* Role selector */}
          <div className="mb-6">
            <p className="text-xs font-bold text-gray-800 font-sora mb-2.5">I am a...</p>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { value: 'student', icon: '👨‍🎓', label: 'Student / Parent', desc: 'Find tutors & post tuition' },
                { value: 'tutor', icon: '👨‍🏫', label: 'Tutor / Educator', desc: 'Teach & earn money' },
              ].map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    role === r.value ? 'border-royal bg-royal-light' : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl mb-2">{r.icon}</div>
                  <div className={`text-sm font-bold font-sora ${role === r.value ? 'text-royal' : 'text-gray-800'}`}>{r.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {error && <Alert variant="error" className="mb-5">⚠️ {error}</Alert>}

          <Button
            onClick={handleGoogleRegister}
            disabled={googleLoading || loading}
            variant="outline"
            size="lg"
            className="w-full mb-5"
          >
            {googleLoading ? 'Connecting...' : (
              <>
                <span className="text-lg">🔵</span> Continue with Google
              </>
            )}
          </Button>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <Input label="Full Name" placeholder="Your full name" value={form.name} onChange={(e) => set('name', e.target.value)} />
            <Input label="Phone Number" placeholder="01XXXXXXXXX" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          </div>

          <Input label="Email Address" type="email" placeholder="your@email.com" value={form.email} onChange={(e) => set('email', e.target.value)} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
            <div className="relative">
              <Input
                label="Password"
                type={showPass ? 'text' : 'password'}
                placeholder="Min 6 characters"
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                className="pr-10"
              />
              <button onClick={() => setShowPass(!showPass)} type="button" className="absolute right-3 top-[38px] text-gray-400">
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={(e) => set('confirmPassword', e.target.value)}
            />
          </div>

          <p className="text-xs text-gray-400 leading-relaxed mb-5">
            By registering, you agree to our{' '}
            <a href="#" className="text-royal no-underline">Terms of Service</a> and{' '}
            <a href="#" className="text-royal no-underline">Privacy Policy</a>.
          </p>

          <Button onClick={handleRegister} disabled={loading || googleLoading} size="lg" className="w-full">
            {loading ? 'Creating account...' : `🚀 Create ${role === 'tutor' ? 'Tutor' : 'Student'} Account`}
          </Button>
        </div>
      </div>
    </div>
  );
}
