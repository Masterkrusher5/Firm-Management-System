import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * 
 * @param {object} props
 * @param {string} props.to
 * @param {string} props.label
 */
const AdminSidebarLink = ({ to, label }) => {
    const commonClasses = "admin-tab-button flex-shrink-0 transition-colors duration-200 ease-in-out rounded-full py-2 px-4";
    const activeClasses = "bg-indigo-600 text-white"; 
    const inactiveClasses = "text-gray-400 hover:bg-gray-700/[0.4] hover:text-gray-200";

    return (
        <NavLink
            to={to}
            end 
            className={({ isActive }) => 
                `${commonClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
        >
            {label}
        </NavLink>
    );
};

export default function AdminSidebar() {
    const { currentUser } = useAuth();
    const isSuperAdmin = currentUser?.role === 'super-admin';
    const isAdmin = currentUser?.role === 'admin';

    return (
        <div className="mb-6 border-b border-gray-700">
            <nav className="flex space-x-2 overflow-x-auto pb-2" aria-label="Tabs">
                <AdminSidebarLink to="/admin" label="Dashboard" />
                <AdminSidebarLink to="/admin/sales" label="Sales" />
                <AdminSidebarLink to="/admin/expenses" label="Expenses" />
                {isAdmin && (
                    <AdminSidebarLink to="/admin/approve-expenses" label="Approve Expenses" />
                )}
                
                <AdminSidebarLink to="/admin/deposits" label="Deposits" />
                {isSuperAdmin && (
                    <>
                        <AdminSidebarLink to="/admin/manage-admins" label="Manage Admins" />
                        <AdminSidebarLink to="/admin/manage-firms" label="Manage Firms" />
                    </>
                )}

                <AdminSidebarLink to="/admin/logs" label="Usage & Logs" />
            </nav>
        </div>
    );
}