import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { FirmDataProvider, useFirmData } from '../contexts/FirmDataContext';
import useInactivityLogout from '../hooks/useInactivityLogout';
import Sidebar from '../components/dashboard/Sidebar';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import Loader from '../components/common/Loader';
import DashboardTab from '../components/dashboard/tabs/DashboardTab';
import InventoryTab from '../components/dashboard/tabs/InventoryTab';
import SalesTab from '../components/dashboard/tabs/SalesTab';
import CustomersTab from '../components/dashboard/tabs/CustomersTab';
import ExpensesTab from '../components/dashboard/tabs/ExpensesTab';
import DepositsTab from '../components/dashboard/tabs/DepositsTab';
import FeedbackTab from '../components/dashboard/tabs/FeedbackTab';
const DashboardContent = () => {  
    const { loading } = useFirmData();
    if (loading) {
        return <Loader fullScreen text="Loading Dashboard..." />;
    }
    return (
        <>
            <DashboardHeader />
            <div className="p-6 md:p-8">
                <Routes>
                    <Route index element={<DashboardTab />} />
                    <Route path="inventory" element={<InventoryTab />} />
                    <Route path="sales" element={<SalesTab />} />
                    <Route path="customers" element={<CustomersTab />} />
                    <Route path="expenses" element={<ExpensesTab />} />
                    <Route path="deposits" element={<DepositsTab />} />
                    <Route path="feedback" element={<FeedbackTab />} />
                </Routes>
            </div>
        </>
    );
};

export default function DashboardPage() {
  useInactivityLogout();
  return (
    <FirmDataProvider>
      <div className="min-h-screen flex bg-gray-100">
        <Sidebar />
        <main className="flex-1 overflow-y-auto light-scrollbar">
          <DashboardContent />
        </main>
      </div>
    </FirmDataProvider>
  );
}