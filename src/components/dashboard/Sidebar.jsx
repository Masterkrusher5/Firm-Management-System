import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import { 
    FaHome, 
    FaBoxes, 
    FaDollarSign, 
    FaUsers, 
    FaMoneyBillWave, 
    FaUniversity, 
    FaCommentDots, 
    FaSignOutAlt 
} from 'react-icons/fa';

/**
 * @param {object} props
 * @param {string} props.to 
 * @param {React.ReactNode} props.icon 
 * @param {string} props.label
 */
const SidebarLink = ({ to, icon, label }) => {
    const commonClasses = "flex items-center p-3 my-1 rounded-lg text-gray-400 font-medium transition-colors duration-200";
    const activeClasses = "bg-indigo-600 text-white"; 
    const inactiveClasses = "hover:bg-gray-800 hover:text-white"; 
    return (
        <NavLink
            to={to}
            end 
            className={({ isActive }) => 
                `${commonClasses} ${isActive ? activeClasses : inactiveClasses}`
            }
        >
            <span className="w-6 mr-3">{icon}</span>
            {label}
        </NavLink>
    );
};

export default function Sidebar() {
    const { logout } = useAuth();
    return (
        <aside className="w-64 bg-gray-900 text-white p-4 flex-col hidden md:flex">
            <h1 className="text-2xl font-bold mb-8 pl-3">Inventory</h1>
            <nav className="flex-grow">
                <SidebarLink to="/dashboard" icon={<FaHome size={18}/>} label="Dashboard" />
                <SidebarLink to="/dashboard/inventory" icon={<FaBoxes size={18}/>} label="Inventory" />
                <SidebarLink to="/dashboard/sales" icon={<FaDollarSign size={18}/>} label="Sales" />
                <SidebarLink to="/dashboard/customers" icon={<FaUsers size={18}/>} label="Customers" />
                <SidebarLink to="/dashboard/expenses" icon={<FaMoneyBillWave size={18}/>} label="Expenses" />
                <SidebarLink to="/dashboard/deposits" icon={<FaUniversity size={18}/>} label="Deposits" />
                <SidebarLink to="/dashboard/feedback" icon={<FaCommentDots size={18}/>} label="Feedback" />
            </nav>
            <div className="mt-auto">
                <button 
                    onClick={logout} 
                    className="w-full text-left flex items-center p-3 my-1 rounded-lg text-gray-400 font-medium transition-colors duration-200 hover:bg-gray-800 hover:text-white"
                >
                    <span className="w-6 mr-3"><FaSignOutAlt size={18}/></span>
                    Logout / Switch Firm
                </button>
            </div>
        </aside>
    );
}