import { useState, useEffect } from 'react';
/**
 * @returns {boolean}
 */
export default function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(() => navigator.onLine);
    useEffect(() => {
        const handleOnline = () => {
            console.log('Browser is now online.');
            setIsOnline(true);
        };
        const handleOffline = () => {
            console.log('Browser is now offline.');
            setIsOnline(false);
        };
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
        
    }, []); 
    return isOnline;
}