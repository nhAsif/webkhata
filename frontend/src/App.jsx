import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Tutor pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Batches from './pages/Batches';
import Attendance from './pages/Attendance';
import Fees from './pages/Fees';
import Homework from './pages/Homework';
import Results from './pages/Results';
import StudentProfile from './pages/StudentProfile';
import Payments from './pages/Payments';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

// Parent portal pages
import ParentLogin from './pages/parent/ParentLogin';
import ParentLayout from './pages/parent/ParentLayout';
import ParentDashboard from './pages/parent/ParentDashboard';
import ParentAttendance from './pages/parent/ParentAttendance';
import ParentFees from './pages/parent/ParentFees';
import ParentRoutine from './pages/parent/ParentRoutine';
import ParentHomework from './pages/parent/ParentHomework';
import ParentResults from './pages/parent/ParentResults';
import ParentVocabulary from './pages/parent/ParentVocabulary';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/parent/login" element={<ParentLogin />} />

          {/* Tutor routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute role="tutor">
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="students/:id" element={<StudentProfile />} />
            <Route path="batches" element={<Batches />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="fees" element={<Fees />} />
            <Route path="homework" element={<Homework />} />
            <Route path="results" element={<Results />} />
            <Route path="payments" element={<Payments />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Parent portal routes */}
          <Route
            path="/parent"
            element={
              <ProtectedRoute role="parent">
                <ParentLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ParentDashboard />} />
            <Route path="attendance" element={<ParentAttendance />} />
            <Route path="fees" element={<ParentFees />} />
            <Route path="routine" element={<ParentRoutine />} />
            <Route path="homework" element={<ParentHomework />} />
            <Route path="results" element={<ParentResults />} />
            <Route path="vocabulary" element={<ParentVocabulary />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#181c24',
            color: '#f0f2f8',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: '10px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#181c24' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#181c24' },
          },
        }}
      />
    </AuthProvider>
  );
}
