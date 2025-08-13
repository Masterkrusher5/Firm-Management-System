import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaShieldAlt } from 'react-icons/fa';

const StaffLogin = ({ onAdminClick, isVisible }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [secretCode, setSecretCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { staffLogin } = useAuth();
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await staffLogin(email, password, secretCode);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed.');
            setLoading(false);
        }
    };
    return (
        <div 
            className={`
                absolute inset-x-0 text-center 
                transition-all duration-500 ease-in-out
                ${isVisible ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 -translate-y-4 z-0 pointer-events-none'}
            `}
        >
            <h1 className="text-3xl font-bold text-white mb-4">Firm Access</h1>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-8 rounded-lg shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your Email" className="w-full bg-gray-700/50 border-gray-600 rounded-md py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your Password" className="w-full bg-gray-700/50 border-gray-600 rounded-md py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    <input type="password" value={secretCode} onChange={(e) => setSecretCode(e.target.value)} placeholder="Firm's Secret Code" className="w-full bg-gray-700/50 border-gray-600 rounded-md py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50">
                        {loading ? 'Accessing...' : 'Access Firm'}
                    </button>
                </form>
                {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
            </div>
            <button onClick={onAdminClick} className="mt-6 text-sm text-gray-400 hover:text-indigo-400 transition-colors">
                Switch to Admin Panel
            </button>
        </div>
    );
};

const AdminLogin = ({ onStaffClick, isVisible }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { adminLogin } = useAuth();
    const navigate = useNavigate();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await adminLogin(email, password);
            navigate('/admin');
        } catch (err) {
            setError(err.message || 'Login failed.');
            setLoading(false);
        }
    };
    
    return (
        <div 
            className={`
                absolute inset-x-0 text-center 
                transition-all duration-500 ease-in-out
                ${isVisible ? 'opacity-100 translate-y-0 z-10' : 'opacity-0 -translate-y-4 z-0 pointer-events-none'}
            `}
        >
            <h1 className="text-3xl font-bold text-white mb-4">Administrator Panel</h1>
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 p-8 rounded-lg shadow-2xl">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin Email" className="w-full bg-gray-700/50 border-gray-600 rounded-md py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-gray-700/50 border-gray-600 rounded-md py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105 disabled:opacity-50">
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                {error && <p className="text-red-400 mt-4 text-sm">{error}</p>}
            </div>
            <button onClick={onStaffClick} className="mt-6 text-sm text-gray-400 hover:text-indigo-400 transition-colors">
                Back to Firm Access
            </button>
        </div>
    );
};

export default function LoginPage() {
    const [showAdminLogin, setShowAdminLogin] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoaded(true);
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 bg-gradient-to-br from-gray-900 to-indigo-900/50 p-4 text-gray-200 overflow-hidden">
            <div className="flex-grow flex flex-col items-center justify-center w-full">
                <div 
                    className={`text-center mb-10 transition-all duration-700 ease-in-out ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5'}`}>
                    <FaShieldAlt className="mx-auto text-indigo-400 text-6xl mb-4" />
                    <h1 className="text-4xl sm:text-5xl font-bold text-white">Firm Management System</h1>
                    <p className="text-gray-400 mt-2">Please log in to continue.</p>
                </div>
                <div className="relative w-full max-w-md min-h-[26rem]"> 
                    <StaffLogin onAdminClick={() => setShowAdminLogin(true)} isVisible={!showAdminLogin && isLoaded} />
                    <AdminLogin onStaffClick={() => setShowAdminLogin(false)} isVisible={showAdminLogin && isLoaded} />
                </div>
            </div>
            
            <footer 
                className={`w-full text-center p-4 text-xs text-gray-500 transition-opacity duration-700 delay-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
                <p>&copy; {new Date().getFullYear()} Designed & Developed By Ronit Debnath. All rights reserved.</p>
            </footer>
        </div>
    );
}