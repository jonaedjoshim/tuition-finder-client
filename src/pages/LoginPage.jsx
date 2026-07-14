import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Input, Alert } from '../components/ui';

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPass, setShowPass] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const goToDashboard = (role) => {
    if (role === 'admin') navigate('/admin');
    else if (role === 'tutor') navigate('/tutor/dashboard');
    else navigate('/student/dashboard');
  };

  const friendlyFirebaseError = (err) => {
    const code = err?.code || '';
    if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
      return 'Invalid email or password. Please try again.';
    }
    if (code.includes('too-many-requests')) {
      return 'Too many attempts. Please wait a moment and try again.';
    }
    return err?.response?.data?.message || 'Could not sign in. Please try again.';
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.email || !form.password) return setError('Please fill in all fields.');
    setLoading(true);
    try {
      const userData = await login(form.email, form.password);
      goToDashboard(userData.role);
    } catch (err) {
      setError(friendlyFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const userData = await loginWithGoogle('student');
      goToDashboard(userData.role);
    } catch (err) {
      setError(friendlyFirebaseError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[#FDFBF7]">
      {/* Left — branding */}
      <div className="hidden md:flex flex-col justify-center items-center p-16 relative overflow-hidden bg-gradient-to-br from-royal-dark via-royal to-violet">
        <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-white/[0.06]" />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full bg-white/[0.04]" />

        <Link to="/" className="flex items-center gap-3 no-underline mb-16 relative z-10">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-xl">🎓</div>
          <span className="font-sora font-bold text-xl text-white">TuitionFinder</span>
        </Link>

        <div className="text-center max-w-sm relative z-10">
          <div className="text-7xl mb-7">👋</div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">Welcome Back!</h2>
          <p className="text-base text-white/70 leading-relaxed">
            Log in to connect with tutors, manage your tuition posts, and continue your learning journey.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-col justify-center items-center px-6 md:px-12 py-10 overflow-y-auto">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-extrabold text-gray-900 font-sora mb-2">Sign in</h1>
          <p className="text-sm text-gray-500 mb-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-royal font-semibold no-underline">Register free →</Link>
          </p>

          {error && <Alert variant="error" className="mb-5">⚠️ {error}</Alert>}

          <Button
            onClick={handleGoogleLogin}
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

          <Input
            label="Email Address"
            type="email"
            placeholder="your@email.com"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPass ? 'text' : 'password'}
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="pr-11"
            />
            <button
              onClick={() => setShowPass(!showPass)}
              type="button"
              className="absolute right-3 top-[38px] text-gray-400 hover:text-gray-600"
            >
              {showPass ? '🙈' : '👁️'}
            </button>
          </div>

          <Button onClick={handleSubmit} disabled={loading || googleLoading} size="lg" className="w-full mt-2">
            {loading ? 'Signing in...' : '🚀 Sign In'}
          </Button>
        </div>
      </div>
    </div>
  );
}
