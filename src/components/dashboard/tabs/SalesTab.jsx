import React, { useState, useMemo } from 'react';
import { useFirmData } from '../../../contexts/FirmDataContext';
import { inrFormatter, getAllFileUrls, toLocalISOString, formatDate } from '../../../services/pocketbase';
import SettlePaymentModal from '../SettlePaymentModal';
import ImageViewerModal from '../../common/ImageViewerModal';
const SaleRecordItem = ({ sale, onSettle, onViewProofs }) => {
    const saleDate = formatDate(sale.created);
    const itemsSummary = sale.items?.map(i => `${i.name} (x${i.quantity})`).join(', ') || 'No items listed.';
    const statusColor = sale.status === 'PAID' ? 'text-green-600' : 'text-yellow-600';
    const hasProofs = sale.payment_proofs && sale.payment_proofs.length > 0;
    return (
        <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <p className="font-bold text-lg text-gray-800">{sale.customer_details?.name || 'Unknown Customer'}</p>
                    <p className="text-sm text-gray-600">{sale.customer_details?.phone || ''}</p>
                    <p className="text-xs text-gray-500 mt-2">Order: {sale.order_number || 'N/A'} | Seller: {sale.seller_name || 'N/A'}</p>
                    <p className="text-sm text-gray-500 mt-1 italic">{itemsSummary}</p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="font-bold text-xl">{inrFormatter.format(sale.payment?.total || 0)}</p>
                    <p className={`text-sm font-semibold ${statusColor}`}>{sale.status}</p>
                    <p className="text-xs text-gray-500">{saleDate}</p>
                    {hasProofs && (
                        <button onClick={onViewProofs} className="mt-2 bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-bold py-1 px-2 rounded">
                            View Proofs
                        </button>
                    )}
                </div>
            </div>
            {sale.payment?.due > 0 && (
                <div className="mt-3 pt-3 border-t flex justify-end items-center gap-4">
                    <span className="text-sm text-yellow-700">Due: {inrFormatter.format(sale.payment.due)}</span>
                    <button onClick={() => onSettle(sale)} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-3 rounded">
                        Settle
                    </button>
                </div>
            )}
        </div>
    );
};

export default function SalesTab() {
    const { sales } = useFirmData();
    const [filter, setFilter] = useState('today');
    const [specificDate, setSpecificDate] = useState('');
    const [saleToSettle, setSaleToSettle] = useState(null);
    const [proofsToView, setProofsToView] = useState([]);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const filteredSales = useMemo(() => {
        if (!sales) return [];
        if (specificDate) {
            return sales.filter(s => toLocalISOString(s.created) === specificDate);
        }
        if (filter === 'today') {
            const todayStr = toLocalISOString(new Date());
            return sales.filter(s => toLocalISOString(s.created) === todayStr);
        }
        if (filter === 'yesterday') {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = toLocalISOString(yesterday);
            return sales.filter(s => toLocalISOString(s.created) === yesterdayStr);
        }
        return sales; 
    }, [sales, filter, specificDate]);

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setSpecificDate('');
    };
    const handleDateChange = (e) => {
        setSpecificDate(e.target.value);
        if (e.target.value) {
            setFilter('date');
        } else if (filter === 'date') {
            setFilter('all');
        }
    };

    const handleViewProofs = (urls) => {
        setProofsToView(urls);
        setIsViewerOpen(true);
    };

    const filterButtons = [
        { id: 'today', label: 'Today' },
        { id: 'yesterday', label: 'Yesterday' },
        { id: 'all', label: 'View All' },
    ];

    return (
        <>
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">Sales Records</h2>
                <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b">
                    <p className="text-sm font-medium text-gray-600">Filter by:</p>
                    <div className="flex items-center gap-2">
                         {filterButtons.map(btn => (
                            <button
                                key={btn.id}
                                onClick={() => handleFilterChange(btn.id)}
                                className={`px-3 py-1 text-sm rounded-md transition-colors ${filter === btn.id ? 'bg-indigo-600 text-white shadow' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <label htmlFor="filter-by-date" className="text-sm text-gray-600">Specific Date:</label>
                        <input type="date" id="filter-by-date" value={specificDate} onChange={handleDateChange} className="border-gray-300 rounded-md shadow-sm text-sm p-1" />
                    </div>
                </div>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto light-scrollbar">
                    {filteredSales.length > 0 ? filteredSales.map(sale => (
                        <SaleRecordItem 
                            key={sale.id} 
                            sale={sale} 
                            onSettle={setSaleToSettle} 
                            onViewProofs={() => handleViewProofs(getAllFileUrls(sale, 'payment_proofs'))} 
                        />
                    )) : (
                        <p className="text-gray-500 p-4 text-center">No sales found for this period.</p>
                    )}
                </div>
            </div>
            <SettlePaymentModal isOpen={!!saleToSettle} onClose={() => setSaleToSettle(null)} saleToSettle={saleToSettle} />
            <ImageViewerModal isOpen={isViewerOpen} onClose={() => setIsViewerOpen(false)} imageUrls={proofsToView} title="Payment Proofs" />
        </>
    );
}