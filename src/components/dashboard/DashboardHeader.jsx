import React from 'react';
import { useFirmData } from '../../contexts/FirmDataContext';
import useOnlineStatus from '../../hooks/useOnlineStatus'; 

export default function DashboardHeader() {    
    const { firmName } = useFirmData();
    const isOnline = useOnlineStatus();
    return (
        <header className="flex flex-col md:flex-row justify-between md:items-center mb-6 px-6 md:px-8 pt-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">
                    Managing: {firmName || '...'}
                </h2>
            </div>
            <div id="status-indicators" className="flex items-center gap-4 text-sm mt-2 md:mt-0">
                <div id="internet-status" className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full transition-colors ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span>{isOnline ? 'Online' : 'Offline'}</span>
                </div>
            </div>
        </header>
    );
}