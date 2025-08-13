import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { pb } from './services/pocketbase'; 
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import ProtectedRoute from './components/common/ProtectedRoute';
import Loader from './components/common/Loader';

const AppRoutes = () => {
    const { isLoggedIn, isAdmin, loadingAuth, currentUser } = useAuth();
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (isLoggedIn && currentUser) {
                const logoutUrl = `${pb.baseUrl}/api/collections/${currentUser.collectionName}/records/${currentUser.id}`;
                const formData = new FormData();
                formData.append('is_logged_in', 'false');
                navigator.sendBeacon(logoutUrl, formData);
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [isLoggedIn, currentUser]);
    if (loadingAuth) {
        return <Loader fullScreen text="Initializing..." />;
    }

    return (
        <Routes>
            <Route
                path="/login"
                element={
                    isLoggedIn ? (
                        <Navigate to={isAdmin ? '/admin' : '/dashboard'} replace />
                    ) : (
                        <LoginPage />
                    )
                }
            />
            <Route
                path="/dashboard/*"
                element={
                    <ProtectedRoute requireStaff>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin/*"
                element={
                    <ProtectedRoute requireAdmin>
                        <AdminPage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="*"
                element={
                    <Navigate 
                        to={isLoggedIn ? (isAdmin ? '/admin' : '/dashboard') : '/login'} 
                        replace 
                    />
                }
            />
        </Routes>
    );
};

function App() {
  return (
    //<BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    //</BrowserRouter>
  );
}

export default App;
