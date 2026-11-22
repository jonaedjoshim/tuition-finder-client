import { Icon } from "../components/ui/Icon";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button, Input, Alert, Card } from "../components/ui";

const ROLES = [
  {
    value: "student",
    icon: "user",
    label: "Student / Parent",
    desc: "Find tutors & post tuition",
  },
  {
    value: "tutor",
    icon: "bookOpen",
    label: "Tutor / Educator",
    desc: "Teach & earn money",
  },
];

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const defaultRole = params.get("role") === "tutor" ? "tutor" : "student";

  const [role, setRole] = useState(defaultRole);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const friendlyFirebaseError = (err) => {
    const code = err?.code || "";
    if (code.includes("email-already-in-use"))
      return "An account with this email already exists.";
    if (code.includes("weak-password"))
      return "Password is too weak. Use at least 6 characters.";
    if (code.includes("invalid-email"))
      return "Please enter a valid email address.";
    return (
      err?.response?.data?.message || "Registration failed. Please try again."
    );
  };

  const handleRegister = async () => {
    setError("");
    if (!form.name || !form.email || !form.password)
      return setError("Please fill in all required fields.");
    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match.");
    if (form.password.length < 6)
      return setError("Password must be at least 6 characters.");
    setLoading(true);

    try {
      const { confirmPassword, ...payload } = form;
      await register({ ...payload, role });
      navigate(role === "tutor" ? "/tutor/dashboard" : "/student/dashboard");
    } catch (err) {
      setError(friendlyFirebaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError("");
    setGoogleLoading(true);
    try {
      const googleUser = await loginWithGoogle(role);
      navigate(
        googleUser.role === "tutor" ? "/tutor/dashboard" : "/student/dashboard",
      );
    } catch (err) {
      setError(friendlyFirebaseError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const perks =
    role === "tutor"
      ? [
          "Free to register",
          "Flexible hours",
          "Verified badge",
          "Direct messaging",
        ]
      : [
          "Find the right tutor fast",
          "Verified & safe profiles",
          "Direct messaging",
          "Review & rate tutors",
        ];

  return (
    <div data-reveal className="min-h-screen bg-canvas md:grid md:grid-cols-2">
      {/* Left — brand panel */}
      <div className="relative hidden flex-col items-center justify-center overflow-hidden bg-brand px-12 py-16 text-surface md:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-surface/[0.06]" />

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
            <Icon name={role === "tutor" ? "bookOpen" : "user"} size={40} strokeWidth={1.3} />
          </div>
          <p className="eyebrow mb-3 !text-surface/70">Get started</p>
          <h2 className="mb-4 text-2xl font-semibold leading-tight text-surface md:text-4xl">
            {role === "tutor"
              ? "Share your knowledge."
              : "Start your journey."}
          </h2>
          <p className="text-sm leading-relaxed text-surface/75">
            {role === "tutor"
              ? "Join tutors teaching subjects they love on their own schedule."
              : "Connect with verified tutors and achieve your academic goals."}
          </p>

          <div className="mt-10 flex flex-col gap-3">
            {perks.map((t) => (
              <div
                key={t}
                className="flex items-center gap-2.5 rounded-xl bg-surface/[0.12] px-3.5 py-2.5 text-sm font-medium text-surface/90"
              >
                <Icon name="check" size={16} className="shrink-0" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[440px]">
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
              Create account
            </h1>
            <p className="mt-2 mb-7 text-sm text-muted">
              Already registered?{" "}
              <Link
                to="/login"
                className="font-semibold text-brand no-underline hover:underline"
              >
                Sign in →
              </Link>
            </p>

            {/* Role selector */}
            <div className="mb-6">
              <p className="mb-2.5 text-xs font-semibold tracking-wide text-ink/90">
                I am a...
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ROLES.map((r) => {
                  const active = role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      aria-pressed={active}
                      className={`flex min-w-0 items-start gap-3 rounded-card border p-3.5 text-left transition-colors ${
                        active
                          ? "border-brand bg-brand-soft"
                          : "border-line bg-surface hover:border-brand/40"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          active
                            ? "bg-brand text-surface"
                            : "bg-canvas text-muted"
                        }`}
                      >
                        <Icon name={r.icon} size={18} />
                      </span>
                      <span className="min-w-0">
                        <span
                          className={`block text-[13px] font-semibold ${active ? "text-brand" : "text-ink"}`}
                        >
                          {r.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-muted/70">
                          {r.desc}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <Alert variant="error" className="mb-5">
                {error}
              </Alert>
            )}

            <Button
              onClick={handleGoogleRegister}
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

            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <Input
                label="Full Name"
                placeholder="Your full name"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
              <Input
                label="Phone Number"
                placeholder="01XXXXXXXXX"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />

            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <div className="relative">
                <Input
                  label="Password"
                  type={showPass ? "text" : "password"}
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
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
              <Input
                label="Confirm Password"
                type="password"
                placeholder="Repeat password"
                value={form.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
              />
            </div>

            <p className="mb-5 text-xs leading-relaxed text-muted/70">
              By registering, you agree to our{" "}
              <a href="#" className="text-brand no-underline hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-brand no-underline hover:underline">
                Privacy Policy
              </a>
              .
            </p>

            <Button
              onClick={handleRegister}
              disabled={loading || googleLoading}
              size="lg"
              className="w-full"
            >
              {loading
                ? "Creating account..."
                : `Create ${role === "tutor" ? "Tutor" : "Student"} Account`}
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
