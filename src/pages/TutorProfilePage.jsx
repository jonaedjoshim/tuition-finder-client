import { Icon } from "../components/ui/Icon";
import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import { tutorAPI, reviewAPI, reportAPI, messageAPI } from "../api";
import { useApi } from "../hooks/useApi";
import { notifySuccess, notifyError } from "../utils/toast";
import { colorFor, initialsFor, getErrorMessage } from "../utils/helpers";
import {
  Button,
  Card,
  Badge,
  Skeleton,
  Alert,
  Textarea,
  Select,
  Modal,
} from "../components/ui";

// useApi keeps the raw axios response; response.data is the API envelope.
const unwrap = (source) => source?.data ?? source;
const toArray = (value) =>
  Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [];
const listFrom = (source) => toArray(unwrap(source)?.data ?? unwrap(source));

function Stars({ n = 5 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={`text-sm ${i <= Math.floor(n) ? "text-warning" : "text-muted/50"}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function TutorProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [tab, setTab] = useState("about");
  const [showContact, setShowContact] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [msgSent, setMsgSent] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sending, setSending] = useState(false);
  const msgSentTimer = useRef(null);

  useEffect(
    () => () => {
      if (msgSentTimer.current) clearTimeout(msgSentTimer.current);
    },
    [],
  );

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState("user");
  const [reportReason, setReportReason] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const profileApi = useApi(() => tutorAPI.getById(id), [id]);
  const reviewsApi = useApi(() => reviewAPI.getForTutor(id), [id]);

  const profileBody = unwrap(profileApi.data);
  const rawProfile = profileBody?.profile ?? profileBody;
  const profile = rawProfile?._id ? rawProfile : null;

  let reviews = listFrom(reviewsApi.data);
  if (reviews.length === 0) reviews = toArray(profileBody?.reviews);

  const reloadAll = () => {
    profileApi.reload();
    reviewsApi.reload();
  };

  const handleSendMessage = async () => {
    if (!msgText.trim() || !profile) return;
    setSending(true);
    setSendError("");
    try {
      await messageAPI.send({
        receiverId: profile.user._id,
        text: msgText.trim(),
      });
      setMsgSent(true);
      if (msgSentTimer.current) clearTimeout(msgSentTimer.current);
      msgSentTimer.current = setTimeout(() => {
        setMsgSent(false);
        setMsgText("");
        setShowContact(false);
      }, 2000);
    } catch (err) {
      const msg = getErrorMessage(err, "Could not send message.");
      setSendError(msg);
      notifyError(msg);
    } finally {
      setSending(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!profile?.user?._id) return;
    setReviewSubmitting(true);
    try {
      await reviewAPI.add(profile.user._id, {
        rating: Number(reviewRating),
        comment: reviewComment.trim(),
      });
      notifySuccess("Your review has been submitted. Thank you!");
      setReviewOpen(false);
      setReviewComment("");
      setReviewRating(5);
      reloadAll();
    } catch (err) {
      notifyError(getErrorMessage(err, "Could not submit your review."));
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!profile?.user?._id || !reportReason.trim()) return;
    setReportSubmitting(true);
    try {
      await reportAPI.create({
        type: reportType,
        reason: reportReason.trim(),
        against: profile.user._id,
      });
      notifySuccess("Report submitted. Our team will review it.");
      setReportOpen(false);
      setReportReason("");
      setReportType("user");
    } catch (err) {
      notifyError(getErrorMessage(err, "Could not submit your report."));
    } finally {
      setReportSubmitting(false);
    }
  };

  if (profileApi.loading) {
    return (
      <>
        <Navbar />
        <div className="bg-canvas min-h-screen pt-[68px]">
          <div className="bg-brand py-12 pb-20">
            <div className="container max-w-[1200px] mx-auto px-6 flex items-center gap-7">
              <Skeleton className="h-24 w-24 rounded-full !bg-surface/25" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-7 w-1/3 !bg-surface/30" />
                <Skeleton className="h-4 w-1/2 !bg-surface/20" />
                <Skeleton className="h-4 w-2/5 !bg-surface/20" />
              </div>
            </div>
          </div>
          <div className="container max-w-[1200px] mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-7">
            <div className="space-y-5">
              <Card className="p-7 space-y-4">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-2/3" />
              </Card>
              <Card className="p-7 space-y-4">
                <Skeleton className="h-5 w-1/4" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </Card>
              <Card className="p-7 space-y-4">
                <Skeleton className="h-5 w-1/4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </Card>
            </div>
            <Card className="p-6 space-y-4">
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-24 w-full" />
            </Card>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (profileApi.error || !profile) {
    return (
      <>
        <Navbar />
        <div className="pt-[68px] min-h-[80vh] flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">
              <Icon name="meh" />
            </div>
            <h3 className="text-lg font-bold text-ink/90 font-sora mb-1.5">
              Tutor not found
            </h3>
            <p className="text-sm text-muted/70 max-w-xs mb-4">
              {typeof profileApi.error === "string"
                ? profileApi.error
                : getErrorMessage(
                    profileApi.error,
                    "This tutor profile could not be loaded.",
                  )}
            </p>
            <Link to="/tutors" className="no-underline">
              <Button>Browse Tutors</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const name = profile.user?.name || "Tutor";
  const initials = initialsFor(name);
  const tutorUserId = profile.user?._id;
  const isOwnProfile = !!(
    user &&
    tutorUserId &&
    String(user._id) === String(tutorUserId)
  );
  const canReview = user?.role === "student" && !isOwnProfile;
  const ratingDist = [5, 4, 3, 2, 1].map((n) => {
    const count = reviews.filter((r) => r.rating === n).length;
    const pct = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
    return { n, pct };
  });

  return (
    <>
      <Navbar />
      <div data-reveal className="pt-[68px] bg-canvas min-h-screen">
        {/* Header band */}
        <div className="bg-brand py-12 pb-20">
          <div className="container max-w-[1200px] mx-auto px-6">
            <div className="flex items-end gap-7 flex-wrap">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center border-2 border-surface bg-transparent text-surface font-bold text-3xl font-sora shrink-0"
              >
                {initials}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2.5 flex-wrap mb-1.5">
                  <h1 className="text-2xl md:text-3xl font-semibold text-surface">
                    {name}
                  </h1>
                  {profile.verified && <Badge variant="green"> Verified</Badge>}
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(profile.subjects || []).map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 rounded-full bg-surface/20 text-surface text-[13px] font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-5 flex-wrap text-surface/85 text-sm">
                  <div className="flex items-center gap-1.5">
                    <Stars n={profile.ratingAvg || 0} />
                    <span className="font-bold">{profile.ratingAvg || 0}</span>
                    <span className="opacity-70">
                      ({profile.ratingCount || 0} reviews)
                    </span>
                  </div>
                  <div className="text-surface/75">
                    {profile.location || "N/A"}
                    {profile.area ? `, ${profile.area}` : ""}
                  </div>
                  <div className="text-surface/75">
                    {profile.experience || 0} yrs experience
                  </div>
                  {profile.online && (
                    <span className="text-surface/85"> Online Available</span>
                  )}
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
                  {[
                    ["about", "About"],
                    ["reviews", "Reviews"],
                  ].map(([t, l]) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                        tab === t
                          ? "bg-brand text-surface"
                          : "text-muted hover:bg-canvas"
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </Card>

              {tab === "about" && (
                <>
                  <Card className="p-7 mb-5">
                    <h3 className="text-lg font-bold text-ink font-sora mb-4">
                      About Me
                    </h3>
                    {profile.bio ? (
                      profile.bio.split("\n\n").map((p, i) => (
                        <p
                          key={i}
                          className="text-[15px] leading-relaxed text-muted mb-3.5"
                        >
                          {p}
                        </p>
                      ))
                    ) : (
                      <p className="text-[15px] text-muted/70">
                        This tutor hasn't added a bio yet.
                      </p>
                    )}
                  </Card>

                  <Card className="p-7 mb-5">
                    <h3 className="text-lg font-bold text-ink font-sora mb-4">
                      Qualification
                    </h3>
                    <p className="text-[15px] text-muted">
                      {profile.qualification || "Not provided yet."}
                    </p>
                  </Card>

                  <Card className="p-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      {
                        label: "Classes Taught",
                        opts: profile.classLevel || [],
                      },
                      {
                        label: "Teaching Areas",
                        opts: profile.area ? [profile.area] : [],
                      },
                    ].map(({ label, opts }) => (
                      <div key={label}>
                        <h4 className="text-xs font-bold text-muted/70 uppercase tracking-wide mb-2.5">
                          {label}
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {opts.length ? (
                            opts.map((o) => (
                              <span
                                key={o}
                                className="px-2.5 py-0.5 rounded-full bg-line/40 text-muted text-xs"
                              >
                                {o}
                              </span>
                            ))
                          ) : (
                            <span className="text-[13px] text-muted/70">
                              Not specified
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </Card>
                </>
              )}

              {tab === "reviews" && (
                <Card className="p-7">
                  <div className="flex items-center gap-5 mb-7 pb-6 border-b border-line/70">
                    <div className="text-center">
                      <div className="text-5xl font-semibold text-ink font-sora leading-none">
                        {profile.ratingAvg || 0}
                      </div>
                      <Stars n={profile.ratingAvg || 0} />
                      <div className="text-[13px] text-muted/70 mt-1.5">
                        {profile.ratingCount || 0} reviews
                      </div>
                    </div>
                    <div className="flex-1">
                      {ratingDist.map(({ n, pct }) => (
                        <div
                          key={n}
                          className="flex items-center gap-2.5 mb-1.5"
                        >
                          <span className="text-xs text-muted/70 w-2.5">
                            {n}
                          </span>
                          <span className="text-xs text-warning">★</span>
                          <div className="flex-1 h-2 rounded bg-line/40 overflow-hidden">
                            <div
                              className="h-full bg-warning rounded"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted/70 w-7">
                            {pct}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {reviews.length === 0 ? (
                    <p className="text-sm text-muted/70 text-center py-5">
                      No reviews yet.
                    </p>
                  ) : (
                    reviews.map((r, i) => {
                      const rName = r.student?.name || "Student";
                      return (
                        <div
                          key={r._id || i}
                          className={`pb-5 mb-5 ${i < reviews.length - 1 ? "border-b border-line/50" : ""}`}
                        >
                          <div className="flex items-center gap-3 mb-2.5">
                            <div
                              className="w-[38px] h-[38px] rounded-full flex items-center justify-center border-2 bg-transparent text-[13px] font-bold font-sora shrink-0"
                              style={{ borderColor: colorFor(rName), color: colorFor(rName) }}
                            >
                              {initialsFor(rName)}
                            </div>
                            <div className="font-bold text-sm text-ink font-sora">
                              {rName}
                            </div>
                            <div className="ml-auto">
                              <Stars n={r.rating} />
                            </div>
                          </div>
                          {r.comment && (
                            <p className="text-sm leading-relaxed text-muted">
                              "{r.comment}"
                            </p>
                          )}
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
                <div className="text-3xl font-semibold text-brand font-sora mb-1">
                  ৳{profile.fee || 0}/hr
                </div>
                <div className="text-[13px] text-muted/70 mb-5">
                  Negotiable for long-term
                </div>

                {user ? (
                  !isOwnProfile && (
                    <Button
                      onClick={() => setShowContact(!showContact)}
                      size="lg"
                      className="w-full mb-2"
                    >
                      Send Message
                    </Button>
                  )
                ) : (
                  <Link to="/login" className="no-underline block">
                    <Button size="lg" className="w-full mb-2">
                      Login to Contact
                    </Button>
                  </Link>
                )}

                {canReview && (
                  <Button
                    onClick={() => setReviewOpen(true)}
                    variant="secondary"
                    size="lg"
                    className="w-full mb-2"
                  >
                    <Icon name="star" /> Write a Review
                  </Button>
                )}
                {user && !isOwnProfile && (
                  <Button
                    onClick={() => setReportOpen(true)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Report
                  </Button>
                )}

                {showContact && (
                  <div className="mt-3.5">
                    <Textarea
                      value={msgText}
                      onChange={(e) => setMsgText(e.target.value)}
                      placeholder={`Hi ${name.split(" ")[0]}, I'd like to hire you for...`}
                      className="h-[100px]"
                    />
                    {sendError && (
                      <Alert variant="error" className="mb-2.5">
                        {sendError}
                      </Alert>
                    )}
                    {msgSent ? (
                      <Alert variant="success">
                        Message sent successfully!
                      </Alert>
                    ) : (
                      <Button
                        onClick={handleSendMessage}
                        disabled={sending}
                        variant="secondary"
                        className="w-full"
                      >
                        {sending ? "Sending..." : "Send →"}
                      </Button>
                    )}
                  </div>
                )}
              </Card>

              <Card className="p-5">
                <h4 className="text-xs font-bold text-muted/70 uppercase tracking-wide mb-3">
                  Quick Info
                </h4>
                {[
                  [
                    <Icon name="pin" />,
                    "Location",
                    `${profile.location || "N/A"}${profile.area ? ", " + profile.area : ""}`,
                  ],
                  [
                    "",
                    "Online",
                    profile.online ? "Available" : "Not available",
                  ],
                ].map(([icon, label, val]) => (
                  <div key={label} className="flex gap-2 mb-2.5 text-sm">
                    <span>{icon}</span>
                    <span className="text-muted/70 min-w-[80px]">{label}:</span>
                    <span className="text-ink/90 font-medium">{val}</span>
                  </div>
                ))}
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal — backend enforces eligibility (e.g. accepted tuition). */}
      <Modal
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        title={`Review ${name}`}
        footer={
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setReviewOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={reviewSubmitting}
              onClick={handleSubmitReview}
            >
              {reviewSubmitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted mb-3">Your rating</p>
        <div className="flex gap-2 mb-5">
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className="cursor-pointer flex flex-col items-center gap-1"
            >
              <input
                type="radio"
                name="review-rating"
                value={n}
                checked={reviewRating === n}
                onChange={() => setReviewRating(n)}
                className="sr-only"
              />
              <span
                className={`text-3xl transition-transform ${n <= reviewRating ? "text-warning" : "text-muted/50"} ${reviewRating === n ? "scale-110" : ""}`}
              >
                ★
              </span>
              <span className="text-[10px] text-muted/70">{n}</span>
            </label>
          ))}
        </div>
        <Textarea
          label="Comment (optional)"
          className="h-[110px]"
          placeholder="Share your experience with this tutor..."
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
        />
      </Modal>

      {/* Report Modal */}
      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="Report Tutor"
        footer={
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setReportOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              disabled={reportSubmitting || !reportReason.trim()}
              onClick={handleSubmitReport}
            >
              {reportSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </div>
        }
      >
        <Select
          label="Report type"
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
        >
          <option value="user">Inappropriate user behavior</option>
          <option value="post">Misleading information</option>
          <option value="other">Something else</option>
        </Select>
        <Textarea
          label="Reason"
          className="h-[110px]"
          placeholder="Tell us what happened..."
          value={reportReason}
          onChange={(e) => setReportReason(e.target.value)}
        />
      </Modal>
      <Footer />
    </>
  );
}
