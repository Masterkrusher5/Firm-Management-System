import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * @param {object} props
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.requireAdmin=false]
 * @param {boolean} [props.requireStaff=false]
 */
export default function ProtectedRoute({ children, requireAdmin = false, requireStaff = false }) {
    
    const { isLoggedIn, isAdmin, isStaff } = useAuth();
    const location = useLocation();
    if (!isLoggedIn) {

        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (requireAdmin && !isAdmin) {
 
        return <Navigate to="/dashboard" replace />;
    }

    if (requireStaff && !isStaff) {
        return <Navigate to="/admin" replace />;
    }
    return children;
}