import { Icon } from "../components/ui/Icon";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import { postAPI } from "../api";
import { notifyError } from "../utils/toast";
import {
  SUBJECTS,
  LOCATIONS,
  CLASS_LEVELS,
  DAYS,
  MEDIUMS,
  TUTOR_GENDERS,
  mediumLabel,
  genderLabel,
} from "../utils/constants";
import {
  MEDIUM_TO_BACKEND,
  TUTOR_GENDER_TO_BACKEND,
  getErrorMessage,
} from "../utils/helpers";
import {
  Button,
  Card,
  Input,
  Select,
  Textarea,
  Alert,
  EmptyState,
} from "../components/ui";

const asList = (v) => (Array.isArray(v) ? v : []);

const subjects = asList(SUBJECTS);
const classes = asList(CLASS_LEVELS);
const locations = asList(LOCATIONS);
const daysOptions = asList(DAYS);

// Shared constants expose { label, value } options for mediums/genders.
// Normalising here also tolerates plain string option lists.
const normaliseOptions = (list, labelFn) =>
  asList(list).map((o) => {
    if (typeof o === "string")
      return { label: (labelFn && labelFn(o)) || o, value: o };
    return {
      label: o.label || (labelFn && labelFn(o.value)) || o.value,
      value: o.value,
    };
  });

const mediumOptions = normaliseOptions(
  asList(MEDIUMS).length ? MEDIUMS : Object.keys(MEDIUM_TO_BACKEND),
  mediumLabel,
);
// Madrasa is always offered, even if a deployment's constant list is out of date.
if (!mediumOptions.some((o) => o.value === "Madrasa"))
  mediumOptions.push({ label: "Madrasa", value: "Madrasa" });

const genderOptions = normaliseOptions(
  asList(TUTOR_GENDERS).length
    ? TUTOR_GENDERS
    : Object.keys(TUTOR_GENDER_TO_BACKEND),
  genderLabel,
);

const labelMedium = (v) =>
  mediumOptions.find((o) => o.value === v)?.label ||
  (typeof mediumLabel === "function" ? mediumLabel(v) : v) ||
  v;
const labelGender = (v) =>
  genderOptions.find((o) => o.value === v)?.label ||
  (typeof genderLabel === "function" ? genderLabel(v) : v) ||
  v;

const toBackendMedium = (m) => {
  if (MEDIUM_TO_BACKEND[m]) return MEDIUM_TO_BACKEND[m];
  const value = String(m || "").toLowerCase();
  if (value.includes("madrasa") || value.includes("madrasah")) return "Madrasa";
  if (value.includes("bangla")) return "Bangla";
  if (value.includes("version")) return "English Version";
  if (value.includes("english")) return "English";
  return m;
};

const toBackendGender = (g) => {
  if (TUTOR_GENDER_TO_BACKEND[g]) return TUTOR_GENDER_TO_BACKEND[g];
  const value = String(g || "").toLowerCase();
  if (value.includes("female")) return "female";
  if (value.includes("male")) return "male";
  return "any";
};

export default function PostTuitionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    subject: "",
    class: "",
    location: "",
    area: "",
    salary: "",
    daysPerWeek: "3",
    preferredDays: [],
    tutorGender: genderOptions[0]?.value || "any",
    medium:
      mediumOptions.find((m) => m.value === "Bangla")?.value ||
      mediumOptions[0]?.value ||
      "Bangla",
    description: "",
    studentGender: "",
    numberOfStudents: "1",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggleDay = (day) => {
    setForm((f) => ({
      ...f,
      preferredDays: f.preferredDays.includes(day)
        ? f.preferredDays.filter((d) => d !== day)
        : [...f.preferredDays, day],
    }));
  };

  const canProceedStep1 = form.subject && form.class && form.location;
  const canProceedStep2 =
    Number(form.salary) > 0 && form.preferredDays.length > 0;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        subject: form.subject,
        classLevel: form.class,
        salary: Number(form.salary),
        location: form.location,
        area: form.area,
        daysPerWeek: Number(form.daysPerWeek),
        preferredDays: form.preferredDays,
        tutorGender: toBackendGender(form.tutorGender),
        medium: toBackendMedium(form.medium),
        description: form.description,
      };
      await postAPI.create(payload);
      setSuccess(true);
    } catch (err) {
      const message = getErrorMessage(
        err,
        "Could not create your post. Please try again.",
      );
      setError(message);
      notifyError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <>
        <Navbar />
        <div className="pt-[68px] min-h-[80vh] flex items-center justify-center">
          <EmptyState
            icon={<Icon name="lock" />}
            title="Login Required"
            desc="Please login or create a free account to post a tuition requirement."
            action={
              <div className="flex gap-2.5">
                <Link to="/login" className="no-underline">
                  <Button>Login</Button>
                </Link>
                <Link to="/register" className="no-underline">
                  <Button variant="outline">Register</Button>
                </Link>
              </div>
            }
          />
        </div>
        <Footer />
      </>
    );
  }

  if (success) {
    return (
      <>
        <Navbar />
        <div className="pt-[68px] min-h-[85vh] flex items-center justify-center bg-canvas">
          <Card className="p-12 text-center max-w-md">
            <div className="text-6xl mb-5">
              <Icon name="checkCircle" />
            </div>
            <h2 className="text-2xl font-semibold text-ink mb-3">
              Tuition Posted Successfully!
            </h2>
            <p className="text-[15px] text-muted mb-2 leading-relaxed">
              Your post is now pending admin approval. Once approved, qualified
              tutors will be able to apply.
            </p>
            <Alert variant="info" className="my-5 text-left">
              ℹ Approval usually takes less than 24 hours.
            </Alert>
            <div className="flex gap-2.5 justify-center">
              <Link to="/student/dashboard" className="no-underline">
                <Button>Go to Dashboard</Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(false);
                  setStep(1);
                  setForm({ ...form, subject: "", class: "", location: "" });
                }}
              >
                Post Another
              </Button>
            </div>
          </Card>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div data-reveal className="pt-[68px] bg-canvas min-h-screen">
        <div className="bg-brand py-10 pb-[50px]">
          <div className="container max-w-[1200px] mx-auto px-6">
            <h1 className="text-2xl md:text-4xl font-semibold text-surface mb-2">
              Post a Tuition Requirement
            </h1>
            <p className="text-[15px] text-surface/75">
              Tell us what you need — we'll connect you with qualified tutors.
            </p>
          </div>
        </div>

        <div className="container max-w-[1200px] mx-auto px-6 -mt-8 pb-16">
          <div className="max-w-[680px] mx-auto">
            {/* Progress */}
            <div className="flex items-center mb-7">
              {[1, 2, 3].map((s, i) => (
                <div
                  key={s}
                  className={`flex items-center ${i < 2 ? "flex-1" : ""}`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm font-sora flex-shrink-0 ${
                      step >= s
                        ? "bg-brand text-surface"
                        : "bg-surface text-muted/50 border-2 border-line"
                    }`}
                  >
                    {step > s ? <Icon name="check" /> : s}
                  </div>
                  {i < 2 && (
                    <div
                      className={`flex-1 h-[3px] mx-2 ${step > s ? "bg-brand" : "bg-line"}`}
                    />
                  )}
                </div>
              ))}
            </div>

            <Card className="p-8">
              {/* STEP 1 */}
              {step === 1 && (
                <>
                  <h3 className="text-lg font-bold mb-1.5"> Subject & Class</h3>
                  <p className="text-sm text-muted mb-6">
                    What does the student need to study?
                  </p>

                  <Select
                    label="Subject *"
                    value={form.subject}
                    onChange={(e) => set("subject", e.target.value)}
                  >
                    <option value="">Select subject</option>
                    {subjects.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </Select>

                  <Select
                    label="Class / Level *"
                    value={form.class}
                    onChange={(e) => set("class", e.target.value)}
                  >
                    <option value="">Select class</option>
                    {classes.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    <Select
                      label="Location *"
                      value={form.location}
                      onChange={(e) => set("location", e.target.value)}
                    >
                      <option value="">Select city</option>
                      {locations.map((l) => (
                        <option key={l}>{l}</option>
                      ))}
                    </Select>
                    <Input
                      label="Area / Neighborhood"
                      placeholder="e.g. Dhanmondi, Uttara"
                      value={form.area}
                      onChange={(e) => set("area", e.target.value)}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="text-sm font-semibold text-ink/90 font-sora block mb-1.5">
                      Medium of Instruction
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {mediumOptions.map((m) => (
                        <button
                          key={m.value}
                          onClick={() => set("medium", m.value)}
                          className={`px-3.5 py-2.5 rounded-lg text-[13px] font-semibold border-[1.5px] transition-colors ${
                            form.medium === m.value
                              ? "border-brand bg-brand-soft text-brand"
                              : "border-line text-muted"
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep1}
                    size="lg"
                    className="w-full mt-2"
                  >
                    Continue →
                  </Button>
                </>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <>
                  <h3 className="text-lg font-bold mb-1.5">
                    Schedule & Budget
                  </h3>
                  <p className="text-sm text-muted mb-6">When and how much?</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                    <Input
                      label="Salary / Hour (৳) *"
                      type="number"
                      min="1"
                      placeholder="e.g. 700"
                      value={form.salary}
                      onChange={(e) => set("salary", e.target.value)}
                    />
                    <Select
                      label="Days per Week"
                      value={form.daysPerWeek}
                      onChange={(e) => set("daysPerWeek", e.target.value)}
                    >
                      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                        <option key={n} value={n}>
                          {n} day{n > 1 ? "s" : ""}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="mb-4">
                    <label className="text-sm font-semibold text-ink/90 font-sora block mb-1.5">
                      Preferred Days *
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {daysOptions.map((d) => (
                        <button
                          key={d}
                          onClick={() => toggleDay(d)}
                          className={`px-3.5 py-2 rounded-full text-[13px] font-medium border-[1.5px] transition-colors ${
                            form.preferredDays.includes(d)
                              ? "border-brand bg-brand-soft text-brand"
                              : "border-line text-muted"
                          }`}
                        >
                          {String(d).slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="text-sm font-semibold text-ink/90 font-sora block mb-1.5">
                      Preferred Tutor Gender
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {genderOptions.map((g) => (
                        <button
                          key={g.value}
                          onClick={() => set("tutorGender", g.value)}
                          className={`flex-1 py-2.5 rounded-lg text-[13px] font-semibold border-[1.5px] transition-colors ${
                            form.tutorGender === g.value
                              ? "border-brand bg-brand-soft text-brand"
                              : "border-line text-muted"
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Input
                    label="Number of Students"
                    type="number"
                    min="1"
                    value={form.numberOfStudents}
                    onChange={(e) => set("numberOfStudents", e.target.value)}
                  />

                  <div className="flex gap-2.5 mt-2">
                    <Button
                      onClick={() => setStep(1)}
                      variant="outline"
                      className="flex-1"
                    >
                      ← Back
                    </Button>
                    <Button
                      onClick={() => setStep(3)}
                      disabled={!canProceedStep2}
                      className="flex-[2]"
                    >
                      Continue →
                    </Button>
                  </div>
                </>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <>
                  <h3 className="text-lg font-bold mb-1.5">
                    Additional Details
                  </h3>
                  <p className="text-sm text-muted mb-6">
                    Anything else tutors should know?
                  </p>

                  <Textarea
                    label="Description (optional)"
                    className="h-[120px]"
                    placeholder="E.g. Student needs help with weak fundamentals in algebra, prefers a patient and friendly teaching style..."
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                  />

                  {/* Summary preview */}
                  <div className="bg-canvas rounded-card p-[18px] mb-6">
                    <h4 className="text-xs font-bold text-muted/70 uppercase tracking-wide mb-3">
                      Post Summary
                    </h4>
                    <div className="flex flex-col gap-2 text-sm">
                      <div>
                        <strong>{form.subject}</strong> for{" "}
                        <strong>{form.class}</strong>
                      </div>
                      <div>
                        {form.location}
                        {form.area ? `, ${form.area}` : ""}
                      </div>
                      <div>
                        ৳{form.salary || 0}/hr • {form.daysPerWeek} days/week
                      </div>
                      <div>
                        {form.preferredDays.join(", ") || "No days selected"}
                      </div>
                      <div> Medium: {labelMedium(form.medium)}</div>
                      <div>
                        Tutor preference: {labelGender(form.tutorGender)}
                      </div>
                    </div>
                  </div>

                  <Alert variant="warning" className="mb-5">
                    Your post will be reviewed by our admin team before going
                    live (usually within 24 hrs).
                  </Alert>

                  {error && (
                    <Alert variant="error" className="mb-5">
                      {error}
                    </Alert>
                  )}

                  <div className="flex gap-2.5">
                    <Button
                      onClick={() => setStep(2)}
                      variant="outline"
                      className="flex-1"
                    >
                      ← Back
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-[2]"
                    >
                      {submitting ? "Submitting..." : "Submit Post"}
                    </Button>
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
