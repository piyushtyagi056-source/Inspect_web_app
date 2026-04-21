import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewInspection from './pages/NewInspection';
import InspectionDetail from './pages/InspectionDetail';

// Layout wrapper for authenticated routes
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { username, isLoading } = useAuth();
  
  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>Loading...</div>;
  }
  
  if (!username) {
    return <Navigate to="/login" replace />;
  }

  return (
    <>
      <Header />
      <main>
        {children}
      </main>
    </>
  );
};

// Route component for login (redirects if already logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { username, isLoading } = useAuth();
  
  if (isLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>Loading...</div>;
  }
  
  if (username) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/new" element={
            <ProtectedRoute>
              <NewInspection />
            </ProtectedRoute>
          } />

          <Route path="/inspection/:id" element={
            <ProtectedRoute>
              <InspectionDetail />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
