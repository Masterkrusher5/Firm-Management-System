import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

import { pb, logErrorToPocketBase, createActivityLog } from '../../../services/pocketbase';
import Loader from '../../common/Loader';
import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';

const CreateAdminForm = ({ onSuccess }) => {
    const [formData, setFormData] = useState({ email: '', password: '', address: '', role: 'admin' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await pb.collection('admins').create({
                ...formData,
                passwordConfirm: formData.password, 
            });
            
            createActivityLog(`Created new admin user: ${formData.email}`);
            
            alert(`Successfully created admin user: ${formData.email}`);
            setFormData({ email: '', password: '', address: '', role: 'admin' }); 
            onSuccess(); 
        } catch (error) {
            logErrorToPocketBase({ message: 'Admin creation failed', stack: error.stack, source: 'ManageAdminsTab.jsx' });
            alert(`Failed to create admin. Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-200">Create New Admin</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><label htmlFor="new-admin-email" className="block text-sm font-medium text-gray-400">Admin Email</label><input type="email" id="new-admin-email" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3" required /></div>
                <div><label htmlFor="new-admin-password" className="block text-sm font-medium text-gray-400">Temporary Password</label><input type="password" id="new-admin-password" name="password" value={formData.password} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3" required /></div>
                <div><label htmlFor="new-admin-address" className="block text-sm font-medium text-gray-400">Address</label><textarea id="new-admin-address" name="address" value={formData.address} onChange={handleChange} rows="2" className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3"></textarea></div>
                <div>
                    <label htmlFor="new-admin-role" className="block text-sm font-medium text-gray-400">Role</label>
                    <select id="new-admin-role" name="role" value={formData.role} onChange={handleChange} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3">
                        <option value="admin">Admin</option>
                        <option value="super-admin">Super Admin</option>
                    </select>
                </div>
                <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">
                    {loading ? 'Creating...' : 'Create Admin User'}
                </button>
            </form>
        </div>
    );
};


const AdminListItem = ({ admin, currentUserId, onDeleteClick }) => (
    <div className="bg-gray-700 p-3 rounded-md flex justify-between items-center">
        <div>
            <p className="font-semibold">{admin.email}</p>
            <p className="text-sm text-gray-400">{admin.address || 'No address provided'}</p>
            <p className="text-sm text-gray-400 capitalize">Role: {admin.role}</p>
        </div>
        {/* */}
        {currentUserId !== admin.id && (
            <button
                onClick={() => onDeleteClick(admin)}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs"
            >
                Delete
            </button>
        )}
    </div>
);

export default function ManageAdminsTab() {
    const { currentUser } = useAuth();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [adminToDelete, setAdminToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const isSuperAdmin = currentUser?.role === 'super-admin';

    const fetchAdmins = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const adminRecords = await pb.collection('admins').getFullList({ 
                sort: 'email',            
                $autoCancel: false,
            });
            setAdmins(adminRecords);
        } catch (err) {
            if (!err.isAbort) {
                setError("Could not load admin users. Check API permissions.");
                logErrorToPocketBase({ message: "Failed to fetch admin list", stack: err.stack, source: 'ManageAdminsTab.jsx' });
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isSuperAdmin) {
            fetchAdmins();
        } else {
            setLoading(false);
        }
    }, [isSuperAdmin, fetchAdmins]);

    const handleDeleteConfirm = async () => {
        if (!adminToDelete) return;
        setIsDeleting(true);
        try {
            await pb.collection('admins').delete(adminToDelete.id);  
            createActivityLog(`Deleted admin user: ${adminToDelete.email}`);
            alert(`Admin ${adminToDelete.email} has been deleted.`);
            setAdminToDelete(null);
            await fetchAdmins();
        } catch (err) {
            logErrorToPocketBase({ message: `Failed to delete admin ${adminToDelete.email}`, stack: err.stack, source: 'ManageAdminsTab.jsx' });
            alert(`Could not delete admin. Error: ${err.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isSuperAdmin) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-red-400 text-lg">You do not have permission to manage administrators.</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <CreateAdminForm onSuccess={fetchAdmins} />
                <div>
                    <h2 className="text-2xl font-semibold mb-4 text-gray-200">Existing Admins</h2>
                    <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                        {loading && <Loader text="Loading Admins..." />}
                        {error && <p className="text-red-400 p-4">{error}</p>}
                        {!loading && !error && admins.map(admin => (
                            <AdminListItem
                                key={admin.id}
                                admin={admin}
                                currentUserId={currentUser.id}
                                onDeleteClick={setAdminToDelete}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <DeleteConfirmationModal
                isOpen={!!adminToDelete}
                onClose={() => setAdminToDelete(null)}
                onConfirm={handleDeleteConfirm}
                isProcessing={isDeleting}
                title="Delete Admin"
                message={`Are you sure you want to permanently delete the admin: ${adminToDelete?.email}? This action cannot be undone.`}
            />
        </>
    );
}