import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import useScrollReveal from "./hooks/useScrollReveal";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import TutorsPage from "./pages/TutorsPage";
import TutorProfilePage from "./pages/TutorProfilePage";
import PostTuitionPage from "./pages/PostTuitionPage";
import StudentDashboard from "./pages/StudentDashboard";
import TutorDashboard from "./pages/TutorDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NotFoundPage from "./pages/NotFoundPage";

function AppShell() {
  const location = useLocation();
  useScrollReveal(location.pathname);

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: "rgb(var(--surface))",
            color: "rgb(var(--ink))",
            border: "1px solid rgb(var(--line))",
            borderRadius: "12px",
            fontFamily: "DM Sans, sans-serif",
            fontSize: "14px",
            fontWeight: 500,
            boxShadow: "0 12px 32px rgb(var(--ink) / 0.12)",
          },
          success: {
            iconTheme: {
              primary: "rgb(var(--brand))",
              secondary: "rgb(var(--surface))",
            },
          },
          error: {
            iconTheme: {
              primary: "rgb(var(--danger))",
              secondary: "rgb(var(--surface))",
            },
          },
        }}
      />
      <div key={location.pathname} className="page-enter">
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/tutors" element={<TutorsPage />} />
          <Route path="/tutors/:id" element={<TutorProfilePage />} />
          <Route
            path="/post-tuition"
            element={
              <ProtectedRoute role="student">
                <PostTuitionPage />
              </ProtectedRoute>
            }
          />

          {/* Student only */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/messages"
            element={
              <ProtectedRoute role="student">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Tutor only */}
          <Route
            path="/tutor/dashboard"
            element={
              <ProtectedRoute role="tutor">
                <TutorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutor/profile"
            element={
              <ProtectedRoute role="tutor">
                <TutorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutor/messages"
            element={
              <ProtectedRoute role="tutor">
                <TutorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutors/jobs"
            element={
              <ProtectedRoute role="tutor">
                <TutorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin only */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}
