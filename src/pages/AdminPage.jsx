import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { pb, logErrorToPocketBase } from '../services/pocketbase';
import AdminHeader from '../components/admin/AdminHeader';
import AdminSidebar from '../components/admin/AdminSidebar';
import Loader from '../components/common/Loader';
import ImageViewerModal from '../components/common/ImageViewerModal';
import useInactivityLogout from '../hooks/useInactivityLogout';
import AdminDashboardTab from '../components/admin/tabs/AdminDashboardTab';
import AdminSalesTab from '../components/admin/tabs/AdminSalesTab';
import AdminExpensesTab from '../components/admin/tabs/AdminExpensesTab';
import ApproveExpensesTab from '../components/admin/tabs/ApproveExpensesTab';
import AdminDepositsTab from '../components/admin/tabs/AdminDepositsTab';
import ManageAdminsTab from '../components/admin/tabs/ManageAdminsTab';
import ManageFirmsTab from '../components/admin/tabs/ManageFirmsTab';
import LogsTab from '../components/admin/tabs/LogsTab';
export default function AdminPage() {
    
    const [firms, setFirms] = useState([]);
    const [isPageLoading, setIsPageLoading] = useState(true); 
    const [totalAdmins, setTotalAdmins] = useState(0);
    const [selectedFirmId, setSelectedFirmId] = useState('');
    const [selectedFirmData, setSelectedFirmData] = useState(null);
    const [loading, setLoading] = useState(false); 
    const [proofsToView, setProofsToView] = useState([]);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    useInactivityLogout();
    const fetchInitialData = useCallback(async () => {
        setIsPageLoading(true); 
        try {
            const firmsPromise = pb.collection('firms').getFullList({ sort: 'name', $autoCancel: false });
            const adminsCountPromise = pb.collection('admins').getList(1, 1, { 
                filter: 'role="admin"',
                $autoCancel: false 
            });
            const [firmRecords, adminCountResult] = await Promise.all([firmsPromise, adminsCountPromise]);
            setFirms(firmRecords);
            setTotalAdmins(adminCountResult.totalItems);
        } catch (error) {
            logErrorToPocketBase({ message: "Failed to fetch initial page data (firms/admins)", stack: error.stack, source: 'AdminPage.jsx' });
            console.error("Failed to fetch initial page data:", error);
        } finally {
            setIsPageLoading(false); 
        }
    }, []);

    const fetchSelectedFirmData = useCallback(async () => {
        if (!selectedFirmId) {
            setSelectedFirmData(null);
            return;
        }
        setLoading(true);
        try {
            const firmId = selectedFirmId;
            const salesPromise = pb.collection('sales').getFullList({ filter: `firm_id="${firmId}"`, sort: '-created' });
            const expensesPromise = pb.collection('expenses').getFullList({ filter: `firm_id="${firmId}"` });
            const depositsPromise = pb.collection('deposits').getFullList({ filter: `firm_id="${firmId}"` });
            const [sales, expenses, deposits] = await Promise.all([salesPromise, expensesPromise, depositsPromise]);
            setSelectedFirmData({ sales, expenses, deposits });

        } catch (error) {
            logErrorToPocketBase({ message: `Failed to fetch data for firm ${selectedFirmId}`, stack: error.stack, source: 'AdminPage.jsx' });
            setSelectedFirmData(null);
        } finally {
            setLoading(false);
        }
    }, [selectedFirmId]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    useEffect(() => {
        fetchSelectedFirmData();
    }, [fetchSelectedFirmData]);
    const handleViewProofs = (urls) => {
        setProofsToView(urls);
        setIsViewerOpen(true);
    };

    const NoFirmSelected = () => (
        <div className="flex items-center justify-center h-full"><p className="text-gray-400 text-lg">Please select a firm from the dropdown above to view data.</p></div>
    );
    
    return (
        <>
            <div className="min-h-screen bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                    
                    <AdminHeader
                        firms={firms}
                        selectedFirmId={selectedFirmId}
                        onFirmChange={setSelectedFirmId}
                        isLoading={isPageLoading} 
                    />

                    <AdminSidebar />
                    
                    <main id="admin-main-content" className="bg-gray-800 p-6 rounded-lg shadow-inner min-h-[60vh]">
                       {loading ? <Loader text="Loading Firm Data..." /> : (
                            <Routes>
                                <Route path="manage-admins" element={<ManageAdminsTab />} />
                                <Route path="manage-firms" element={<ManageFirmsTab onUpdate={fetchInitialData} firms={firms} selectedFirmId={selectedFirmId} selectedFirmData={selectedFirmData} />} />
                                <Route path="logs" element={<LogsTab />} />
                                <Route path="/" element={selectedFirmId ? <AdminDashboardTab firmData={selectedFirmData} /> : <NoFirmSelected />} />
                                <Route path="sales" element={selectedFirmId ? <AdminSalesTab sales={selectedFirmData?.sales || []} onViewProofs={handleViewProofs}/> : <NoFirmSelected />} />
                                <Route path="expenses" element={selectedFirmId ? <AdminExpensesTab expenses={selectedFirmData?.expenses || []} /> : <NoFirmSelected />} />
                                <Route path="approve-expenses" element={selectedFirmId ? <ApproveExpensesTab expenses={selectedFirmData?.expenses || []} onUpdate={fetchSelectedFirmData} totalAdmins={totalAdmins} /> : <NoFirmSelected />} />
                                <Route path="deposits" element={selectedFirmId ? <AdminDepositsTab firmId={selectedFirmId} {...selectedFirmData} onUpdate={fetchSelectedFirmData} /> : <NoFirmSelected />} />
                           </Routes>
                       )}
                    </main>
                </div>
            </div>

            <ImageViewerModal
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                imageUrls={proofsToView}
                title="Payment Proofs"
            />
        </>
    );
}