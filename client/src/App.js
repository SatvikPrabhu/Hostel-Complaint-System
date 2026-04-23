import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import WorkerDashboard from './components/WorkerDashboard';
import SupervisorDashboard from './components/SupervisorDashboard';
import PublicDashboard from './components/PublicDashboard';
import UserManagement from './components/UserManagement';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DarkModeProvider } from './context/DarkModeContext';

function ProtectedRoute({ children, allowedRole }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to={`/${user.role}-dashboard`} />;
  }
  
  return children;
}

function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route 
              path="/student-dashboard" 
              element={
                <ProtectedRoute allowedRole="student">
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute allowedRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/user-management"
              element={
                <ProtectedRoute allowedRole="admin">
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/worker-dashboard" 
              element={
                <ProtectedRoute allowedRole="worker">
                  <WorkerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/supervisor-dashboard" 
              element={
                <ProtectedRoute allowedRole="supervisor">
                  <SupervisorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/public" element={<PublicDashboard />} />
          </Routes>
        </Router>
      </AuthProvider>
    </DarkModeProvider>
  );
}

export default App;
