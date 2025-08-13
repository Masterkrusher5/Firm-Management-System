import React, { useState, useMemo } from 'react';
import { inrFormatter, getAllFileUrls, getFileUrl, formatDate, toLocalISOString } from '../../../services/pocketbase';

/**
 * 
 * @param {object} props
 * @param {object} props.sale
 * @param {function} props.onViewPaymentProofs
 * @param {function} props.onViewDeliveryProof
 */
const SaleRecordItem = ({ sale, onViewPaymentProofs, onViewDeliveryProof }) => {
    const saleDate = formatDate(sale.created);
    const itemsSummary = sale.items?.map(i => `${i.name} (x${i.quantity})`).join(', ') || 'No items listed.';
    const statusColor = sale.status === 'PAID' ? 'text-green-400' : 'text-yellow-400';
    const hasPaymentProofs = sale.payment_proofs && sale.payment_proofs.length > 0;
    const deliveryStatus = sale.delivery?.status;
    const hasDeliveryProof = !!sale.delivery_proof;

    return (
        <div className="bg-gray-700 p-4 rounded-lg border border-gray-600 flex flex-col gap-3">
            {/* */}
            <div className="flex justify-between items-start gap-4">
                <div>
                    <p className="font-bold text-lg text-white">{sale.customer_details?.name || 'Unknown Customer'}</p>
                    <p className="text-sm text-gray-400">{sale.customer_details?.phone || ''}</p>
                    <p className="text-xs text-gray-400 mt-2">Order: <span className="font-mono">{sale.order_number || 'N/A'}</span> | Seller: <span className="font-medium">{sale.seller_name || 'N/A'}</span></p>
                    <p className="text-sm text-gray-300 mt-1 italic">{itemsSummary}</p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="font-bold text-xl text-white">{inrFormatter.format(sale.payment?.total || 0)}</p>
                    <p className={`text-sm font-semibold ${statusColor}`}>{sale.status}</p>
                    <p className="text-xs text-gray-500">{saleDate}</p>
                    {hasPaymentProofs && (
                        <button onClick={onViewPaymentProofs} className="mt-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-1 px-2 rounded">
                            View Payment Proofs
                        </button>
                    )}
                </div>
            </div>
            
            {/* */}
            <div className="pt-3 border-t border-gray-600">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Delivery Status</h4>
                {deliveryStatus === 'DELIVERED' ? (
                    <div className="text-sm text-green-400 flex justify-between items-center">
                        <p className="font-semibold">Delivered on: {formatDate(sale.delivery.actualDeliveryDate)}</p>
                        {hasDeliveryProof && (
                             <button onClick={onViewDeliveryProof} className="text-indigo-400 hover:underline text-xs font-medium">
                                View Delivery Proof
                            </button>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-yellow-400">Pending - Expected by {formatDate(sale.delivery.deliveryDate)}</p>
                )}
            </div>
        </div>
    );
};


/**
 * 
 * @param {object} props
 * @param {Array<object>} props.sales
 * @param {function} props.onViewProofs 
 */
export default function AdminSalesTab({ sales, onViewProofs }) {
    const [filter, setFilter] = useState('all');
    const [specificDate, setSpecificDate] = useState('');
    
    const filteredSales = useMemo(() => {
        if (!sales) return [];
        if (specificDate) return sales.filter(s => toLocalISOString(s.created) === specificDate);
        const todayStr = toLocalISOString(new Date());
        if (filter === 'today') return sales.filter(s => toLocalISOString(s.created) === todayStr);
        if (filter === 'yesterday') {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            return sales.filter(s => toLocalISOString(s.created) === toLocalISOString(yesterday));
        }
        return sales;
    }, [sales, filter, specificDate]);

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setSpecificDate('');
    };

    const handleDateChange = (e) => {
        setSpecificDate(e.target.value);
        if (e.target.value) setFilter('date');
        else if (filter === 'date') setFilter('all');
    };
    
    const handleViewDeliveryProof = (sale) => {
        const url = getFileUrl(sale, 'delivery_proof');
        if (url) {
            onViewProofs([url]);
        }
    };

    const filterButtons = [ { id: 'today', label: 'Today' }, { id: 'yesterday', label: 'Yesterday' }, { id: 'all', label: 'View All' }];
    
    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-200">Sales History</h2>
            <div className="flex flex-wrap items-center gap-4 mb-6 pb-4 border-b border-gray-700">
                <p className="text-sm font-medium text-gray-400">Filter by:</p>
                <div className="flex items-center gap-2">
                    {filterButtons.map(btn => (<button key={btn.id} onClick={() => handleFilterChange(btn.id)} className={`px-3 py-1 text-sm rounded-md transition-colors ${filter === btn.id ? 'bg-indigo-600 text-white shadow' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>{btn.label}</button>))}
                </div>
                <div className="flex items-center gap-2"><label htmlFor="admin-filter-by-date" className="text-sm text-gray-400">Specific Date:</label><input type="date" id="admin-filter-by-date" value={specificDate} onChange={handleDateChange} className="bg-gray-700 border-gray-600 text-white rounded-md shadow-sm text-sm p-1"/></div>
            </div>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                {filteredSales.length > 0 ? (
                    filteredSales.map(sale => (
                        <SaleRecordItem 
                            key={sale.id} 
                            sale={sale} 
                            onViewPaymentProofs={() => onViewProofs(getAllFileUrls(sale, 'payment_proofs'))}
                            onViewDeliveryProof={() => handleViewDeliveryProof(sale)}
                        />
                    ))
                ) : (
                     <div className="flex items-center justify-center h-40 bg-gray-700 rounded-lg"><p className="text-gray-400">No sales found for the selected period.</p></div>
                )}
            </div>
        </div>
    );
}