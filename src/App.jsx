import { BrowserRouter, Routes, Route } from 'react-router-dom';
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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
          <Route path="*" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
