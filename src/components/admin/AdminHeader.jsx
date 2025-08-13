import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

/**
 * @param {object} props
 * @param {Array<object>} props.firms 
 * @param {string} props.selectedFirmId 
 * @param {function} props.onFirmChange 
 * @param {boolean} props.isLoading 
 */
export default function AdminHeader({ firms, selectedFirmId, onFirmChange, isLoading }) {
    const { currentUser, logout } = useAuth(); 
    const userRoleDisplay = currentUser?.role
        ? currentUser.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
        : 'Admin';

    return (
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h1 className="text-3xl font-bold">Admin Panel</h1>
                <p className="text-gray-400 mt-1">
                    Logged in as: <span className="font-medium text-gray-300">{currentUser?.email || '...'}</span> 
                    <span className="text-gray-500"> | </span> 
                    Role: <span className="font-medium text-gray-300">{userRoleDisplay}</span>
                </p>
            </div>

            <div className="flex items-center gap-4 w-full md:w-auto">
                <select
                    id="admin-firm-selector"
                    value={selectedFirmId}
                    onChange={(e) => onFirmChange(e.target.value)}
                    className="bg-gray-700 text-white border-gray-600 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 w-full flex-grow disabled:opacity-70 disabled:cursor-not-allowed"
                    disabled={isLoading} 
                >
                    {isLoading ? (
                        
                        <option>Loading firms...</option>
                    ) : (
                        
                        <>
                            <option value="">Select a Firm to View</option>
                            {firms && firms.length > 0 ? (
                                
                                firms.map(firm => (
                                    <option key={firm.id} value={firm.id}>
                                        {firm.name}
                                    </option>
                                ))
                            ) : (
                                
                                <option disabled>No firms found</option>
                            )}
                        </>
                    )}
                </select>

                <button
                    onClick={logout}
                    className="text-sm text-gray-400 hover:text-indigo-300 whitespace-nowrap"
                >
                    Logout
                </button>
            </div>
        </header>
    );
}