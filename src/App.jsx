import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TutorsPage from './pages/TutorsPage';
import TutorProfilePage from './pages/TutorProfilePage';
import PostTuitionPage from './pages/PostTuitionPage';
import StudentDashboard from './pages/StudentDashboard';
import TutorDashboard from './pages/TutorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#FFFFFF',
              color: '#1A1F36',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: 500,
              boxShadow: '0 10px 30px rgba(26, 31, 54, 0.12)',
            },
            success: { iconTheme: { primary: '#2D5BE3', secondary: '#FFFFFF' } },
            error: { iconTheme: { primary: '#DC2626', secondary: '#FFFFFF' } },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/tutors" element={<TutorsPage />} />
          <Route path="/tutors/:id" element={<TutorProfilePage />} />
          <Route path="/post-tuition" element={
            <ProtectedRoute role="student"><PostTuitionPage /></ProtectedRoute>
          } />

          {/* Student only */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
          } />
          <Route path="/student/profile" element={
            <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
          } />
          <Route path="/student/messages" element={
            <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
          } />

          {/* Tutor only */}
          <Route path="/tutor/dashboard" element={
            <ProtectedRoute role="tutor"><TutorDashboard /></ProtectedRoute>
          } />
          <Route path="/tutor/profile" element={
            <ProtectedRoute role="tutor"><TutorDashboard /></ProtectedRoute>
          } />
          <Route path="/tutor/messages" element={
            <ProtectedRoute role="tutor"><TutorDashboard /></ProtectedRoute>
          } />
          <Route path="/tutors/jobs" element={
            <ProtectedRoute role="tutor"><TutorDashboard /></ProtectedRoute>
          } />

          {/* Admin only */}
          <Route path="/admin" element={
            <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
