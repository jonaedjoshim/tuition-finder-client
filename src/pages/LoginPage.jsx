import { Icon } from "../components/ui/Icon";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Input, Alert, Card } from "../components/ui";

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const goToDashboard = (role) => {
    if (role === "admin") navigate("/admin");
    else if (role === "tutor") navigate("/tutor/dashboard");
    else navigate("/student/dashboard");
  };

  const friendlyFirebaseError = (err) => {
    const code = err?.code || "";
    if (
      code.includes("user-not-found") ||
      code.includes("wrong-password") ||
      code.includes("invalid-credential")
    ) {
      return "Invalid email or password. Please try again.";
    }
    if (code.includes("too-many-requests")) {
      return "Too many attempts. Please wait a moment and try again.";
    }
    return (
      err?.response?.data?.message || "Could not sign in. Please try again."
    );
  };

  const handleSubmit = async () => {
    setError("");
    if (!form.email || !form.password)
      return setError("Please fill in all fields.");
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
    setError("");
    setGoogleLoading(true);
    try {
      const userData = await loginWithGoogle("student");
      goToDashboard(userData.role);
    } catch (err) {
      setError(friendlyFirebaseError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div data-reveal className="min-h-screen bg-canvas md:grid md:grid-cols-2">
      {/* Left — brand panel */}
      <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-brand px-12 py-16 text-surface md:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-surface/[0.06]" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-surface/[0.04]" />

        <Link
          to="/"
          className="relative z-10 mb-14 flex items-center gap-3 no-underline"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface/20">
            <Icon name="bookOpen" size={22} />
          </div>
          <span className="font-sora text-xl font-bold text-surface">
            TuitionFinder
          </span>
        </Link>

        <div className="relative z-10 max-w-sm text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-surface/15">
            <Icon name="bookOpen" size={40} strokeWidth={1.3} />
          </div>
          <p className="eyebrow mb-3 !text-surface/70">Welcome back</p>
          <h2 className="mb-4 text-3xl font-semibold leading-tight text-surface md:text-4xl">
            Good to see you again.
          </h2>
          <p className="text-base leading-relaxed text-surface/75">
            Log in to connect with tutors, manage your tuition posts, and
            continue your learning journey.
          </p>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[440px]">
          {/* Compact brand for small screens */}
          <Link
            to="/"
            className="mb-8 flex items-center justify-center gap-2.5 no-underline md:hidden"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-surface">
              <Icon name="bookOpen" size={19} />
            </div>
            <span className="font-sora text-lg font-bold text-ink">
              TuitionFinder
            </span>
          </Link>

          <Card className="p-7 sm:p-9">
            <h1 className="font-sora text-3xl font-semibold text-ink">
              Sign in
            </h1>
            <p className="mt-2 mb-7 text-sm text-muted">
              Don&apos;t have an account?{" "}
              <Link
                to="/register"
                className="font-semibold text-brand no-underline hover:underline"
              >
                Register free →
              </Link>
            </p>

            {error && (
              <Alert variant="error" className="mb-5">
                {error}
              </Alert>
            )}

            <Button
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading}
              variant="outline"
              size="lg"
              className="w-full"
            >
              {googleLoading ? (
                "Connecting..."
              ) : (
                <>
                  <Icon name="globe" size={18} />
                  Continue with Google
                </>
              )}
            </Button>

            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-xs font-semibold tracking-wider text-muted/70">
                OR
              </span>
              <div className="h-px flex-1 bg-line" />
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPass ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? "Hide password" : "Show password"}
                className="absolute right-3 top-[38px] flex h-6 w-6 items-center justify-center text-muted/70 transition-colors hover:text-brand"
              >
                {showPass ? <Icon name="eyeOff" /> : <Icon name="eye" />}
              </button>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={loading || googleLoading}
              size="lg"
              className="mt-2 w-full"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </Card>

          <p className="mt-6 text-center text-xs text-muted/70">
            <Link to="/" className="no-underline hover:text-brand">
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
