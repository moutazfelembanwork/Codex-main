import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Trainees from './pages/Trainees';
import Tasks from './pages/Tasks';
import Documents from './pages/Documents';
import HelpRequests from './pages/HelpRequests';
import Chat from './pages/Chat';
import TraineePlan from './pages/TraineePlan'; // SINGLE IMPORT - REMOVED DUPLICATE

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/trainees" element={
            <ProtectedRoute>
              <Layout>
                <Trainees />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute>
              <Layout>
                <Tasks />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/documents" element={
            <ProtectedRoute>
              <Layout>
                <Documents />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/help-requests" element={
            <ProtectedRoute>
              <Layout>
                <HelpRequests />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <Layout>
                <Chat />
              </Layout>
            </ProtectedRoute>
          } />
          {/* Add Trainee Plan Route */}
          <Route path="/trainee-plan/:traineeId" element={
            <ProtectedRoute>
              <Layout>
                <TraineePlan />
              </Layout>
            </ProtectedRoute>
          } />
          {/* Catch all route - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;