import React, { useState, useMemo } from 'react';
import { useFirmData } from '../../../contexts/FirmDataContext';
import { inrFormatter, formatDate } from '../../../services/pocketbase';
import SettlePaymentModal from '../SettlePaymentModal';
import MarkDeliveredModal from '../MarkDeliveredModal';

const StatCard = ({ title, value, colorClass = 'text-gray-800' }) => (
    <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-500 text-sm font-medium uppercase">{title}</h3>
        <p className={`text-3xl font-bold mt-2 ${colorClass}`}>
            {value}
        </p>
    </div>
);

const UpcomingCollectionsPanel = ({ collections, onSettle }) => {
    const [searchTerm, setSearchTerm] = useState('');
    
    const filteredCollections = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return collections;
        return collections.filter(sale => 
            (sale.customer_details?.name?.toLowerCase().includes(query)) ||
            (sale.order_number?.toLowerCase().includes(query))
        );
    }, [searchTerm, collections]);

    const today = useMemo(() => new Date(new Date().setHours(0, 0, 0, 0)), []);

    return (
        <div className="bg-white p-6 rounded-lg shadow xl:col-span-1">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Upcoming Collections</h2>
            <div className="mb-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by Customer or Order..."
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                />
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto light-scrollbar">
                {filteredCollections.length > 0 ? filteredCollections.map(sale => {
                    const dueDate = sale.payment.dueDate ? new Date(sale.payment.dueDate + 'T00:00:00') : null;
                    const isOverdue = dueDate && dueDate < today;
                    return (
                        <div key={sale.id} className={`bg-gray-50 p-3 rounded-lg flex justify-between items-center border ${isOverdue ? 'border-red-400' : 'border-gray-200'}`}>
                            <div className="flex-grow">
                                <p className="font-semibold text-gray-800">{sale.customer_details?.name}</p>
                                <p className={`text-sm ${isOverdue ? 'text-red-600' : 'text-yellow-600'} font-bold`}>{inrFormatter.format(sale.payment.due)} Due</p>
                                <p className={`text-xs ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>Due Date: {formatDate(sale.payment.dueDate)}</p>
                            </div>
                            <button onClick={() => onSettle(sale)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1 px-3 rounded flex-shrink-0">Settle</button>
                        </div>
                    );
                }) : <p className="text-gray-500 p-4 text-center">No upcoming collections.</p>}
            </div>
        </div>
    );
};

const UpcomingDeliveriesPanel = ({ deliveries, onMarkDelivered }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDeliveries = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return deliveries;
        return deliveries.filter(sale =>
            (sale.customer_details?.name?.toLowerCase().includes(query)) ||
            (sale.order_number?.toLowerCase().includes(query))
        );
    }, [searchTerm, deliveries]);

    return (
        <div className="bg-white p-6 rounded-lg shadow xl:col-span-1">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Upcoming Deliveries</h2>
            <div className="mb-4">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by Customer or Order..."
                    className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                />
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto light-scrollbar">
               {filteredDeliveries.length > 0 ? filteredDeliveries.map(sale => (
                    <div key={sale.id} className="bg-gray-50 p-3 rounded-lg border">
                        <div className="flex justify-between items-start gap-3">
                            <div className="flex-grow">
                                <p className="font-semibold text-gray-800">{sale.customer_details?.name}</p>
                                <p className="text-xs text-gray-500">Expected: {formatDate(sale.delivery.deliveryDate)}</p>
                                <p className="text-xs text-gray-500 mt-1">Order: {sale.order_number}</p>
                            </div>
                            <button onClick={() => onMarkDelivered(sale)} className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-1 px-3 rounded flex-shrink-0">
                                Delivered
                            </button>
                        </div>
                    </div>
               )) : <p className="text-gray-500 p-4 text-center">No pending deliveries found.</p>}
            </div>
        </div>
    );
};

const TopSellingItemsPanel = ({ items }) => (
    <div className="bg-white p-6 rounded-lg shadow xl:col-span-1">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Top Selling Items</h2>
        <div className="space-y-4 max-h-96 overflow-y-auto light-scrollbar">
            {items.length > 0 ? items.map((item, index) => (
                <div key={item.id} className="bg-gray-100 p-3 rounded-lg flex items-center space-x-4 border">
                    <div className="text-xl font-bold text-indigo-600 w-6 text-center">{index + 1}</div>
                    <div>
                        <h3 className="font-semibold text-gray-800">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.sales} units sold</p>
                    </div>
                </div>
            )) : <p className="text-gray-500 p-4 text-center">No sales recorded yet.</p>}
        </div>
    </div>
);

export default function DashboardTab() {
    const { items, sales } = useFirmData();
    const [saleToSettle, setSaleToSettle] = useState(null);
    const [saleToMark, setSaleToMark] = useState(null);
    
    const { dashboardStats, upcomingCollections, upcomingDeliveries, topSellingItems, overdueInfo } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dashboardStats = {
            totalValue: items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0),
            lowStockCount: items.filter(item => Number(item.quantity) > 0 && Number(item.quantity) <= 5).length,
            totalRevenue: sales.reduce((sum, s) => sum + (s.payment?.paid || 0), 0),
            totalDue: sales.reduce((sum, s) => sum + (s.payment?.due || 0), 0),
        };

        const upcomingCollections = sales
            .filter(s => s.payment?.due > 0 && s.payment?.dueDate)
            .sort((a, b) => new Date(a.payment.dueDate) - new Date(b.payment.dueDate));

        const upcomingDeliveries = sales
            .filter(s => s.delivery?.status === 'PENDING' && s.delivery?.deliveryDate)
            .sort((a, b) => new Date(a.delivery.deliveryDate) - new Date(b.delivery.deliveryDate));

        const topSellingItems = items
            .filter(item => (item.sales || 0) > 0)
            .sort((a, b) => (b.sales || 0) - (a.sales || 0))
            .slice(0, 5);
        
        const overdueInfo = {
            payments: upcomingCollections.filter(s => new Date(s.payment.dueDate + 'T00:00:00') < today),
            deliveries: upcomingDeliveries.filter(s => new Date(s.delivery.deliveryDate + 'T00:00:00') < today),
        };

        return { dashboardStats, upcomingCollections, upcomingDeliveries, topSellingItems, overdueInfo };
    }, [items, sales]);

    return (
        <>
            <div className="space-y-8">
                {overdueInfo.payments.length > 0 && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 font-bold p-4 rounded">
                        ⚠️ You have {overdueInfo.payments.length} overdue payment(s)! Please follow up.
                    </div>
                )}
                {overdueInfo.deliveries.length > 0 && (
                    <div className="bg-orange-100 border-l-4 border-orange-500 text-orange-700 font-bold p-4 rounded">
                        ⚠️ You have {overdueInfo.deliveries.length} overdue deliver(y/ies)! Please follow up.
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard title="Total Inventory Value" value={inrFormatter.format(dashboardStats.totalValue)} />
                    <StatCard title="Total Sales Revenue" value={inrFormatter.format(dashboardStats.totalRevenue)} />
                    <StatCard title="Amount Due" value={inrFormatter.format(dashboardStats.totalDue)} colorClass="text-yellow-600" />
                    <StatCard title="Low Stock Items" value={dashboardStats.lowStockCount} colorClass="text-red-600" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                    <UpcomingCollectionsPanel collections={upcomingCollections} onSettle={setSaleToSettle} />
                    <UpcomingDeliveriesPanel deliveries={upcomingDeliveries} onMarkDelivered={setSaleToMark} />
                    <TopSellingItemsPanel items={topSellingItems} />
                </div>
            </div>
            
            <SettlePaymentModal isOpen={!!saleToSettle} onClose={() => setSaleToSettle(null)} saleToSettle={saleToSettle} />
            <MarkDeliveredModal isOpen={!!saleToMark} onClose={() => setSaleToMark(null)} saleToMark={saleToMark} />
        </>
    );
}