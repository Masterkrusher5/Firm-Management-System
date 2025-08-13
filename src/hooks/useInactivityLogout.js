import { useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

const INACTIVITY_TIMEOUT = 5 * 60 * 1000;
export default function useInactivityLogout() {
    const { logout, isLoggedIn } = useAuth();
    const resetTimer = useCallback(() => {
        if (window.logoutTimer) {
            clearTimeout(window.logoutTimer);
        }
        if (isLoggedIn) {
            window.logoutTimer = setTimeout(() => {
                alert("You have been automatically logged out due to inactivity.");
                logout();
            }, INACTIVITY_TIMEOUT);
        }
    }, [isLoggedIn, logout]); 
    useEffect(() => {
        const activityEvents = [
            'mousedown', 
            'mousemove', 
            'keypress', 
            'scroll', 
            'touchstart'
        ];
        activityEvents.forEach(event => {
            window.addEventListener(event, resetTimer);
        });
        resetTimer();
        return () => {
            activityEvents.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
            if (window.logoutTimer) {
                clearTimeout(window.logoutTimer);
            }
        };
    }, [resetTimer]); 
}