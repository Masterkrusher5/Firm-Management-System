import React, { useState, useEffect } from 'react';
import { useFirmData } from '../../../contexts/FirmDataContext';
import { pb, logErrorToPocketBase, inrFormatter } from '../../../services/pocketbase';
import { FaChevronDown } from 'react-icons/fa';
import Loader from '../../common/Loader';

const CustomerCard = ({ customer }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        
        if (!isOpen || history.length > 0) {
            return;
        }
        const fetchHistory = async () => {
            setIsLoadingHistory(true);
            setError(null);
            try {                
                const customerSales = await pb.collection('sales').getFullList({ 
                    filter: `customer_id="${customer.id}"`, 
                    sort: '-created' 
                });
                setHistory(customerSales);
            } catch (err) {
                setError("Could not load purchase history.");
                logErrorToPocketBase({ message: `Failed to fetch history for customer ${customer.id}`, stack: err.stack });
            } finally {
                setIsLoadingHistory(false);
            }
        };
        fetchHistory();

    }, [isOpen, customer.id, history.length]);

    return (
        <div className={`bg-gray-50 rounded-lg text-gray-800 border border-gray-200 customer-card ${isOpen ? 'active' : ''}`}>
            <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div>
                    <p className="font-bold text-lg">{customer.name}</p>
                    <p className="text-sm text-gray-600">{customer.phone}</p>
                    <p className="text-xs text-gray-500">{customer.email || 'No email provided'}</p>
                    <p className="text-xs text-gray-500 mt-1">{customer.address || 'No address provided'}</p>
                </div>
                <FaChevronDown className="fa-chevron-down transform transition-transform" />
            </div>

            <div className="customer-order-history bg-white p-4 border-t border-gray-200">
                {isLoadingHistory && <Loader text="Loading history..." />}
                {error && <p className="text-red-500">{error}</p>}
                {!isLoadingHistory && !error && (
                    history.length > 0 ? (
                        <>
                            <h4 className="font-semibold mb-3 text-sm text-gray-800">Purchase History</h4>
                            <ul className="space-y-3">
                                {history.map(sale => (
                                    <li key={sale.id} className="text-sm border-b border-gray-100 pb-3">
                                        <div className="flex justify-between font-medium">
                                            <span>{sale.created ? new Date(sale.created).toLocaleDateString('en-IN') : 'N/A'}</span>
                                            <span>{inrFormatter.format(sale.payment.total)}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">Order: {sale.order_number}</p>
                                        <p className="text-xs text-gray-500 italic">
                                            {sale.items?.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </>
                    ) : (
                        <p className="text-gray-500">No purchase history found.</p>
                    )
                )}
            </div>
        </div>
    );
};

export default function CustomersTab() {
    const { customers, loading } = useFirmData();

    if (loading) {
        return <Loader text="Loading customers..." />;
    }
    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Customer Directory & History</h2>
            <div className="space-y-4 max-h-[75vh] overflow-y-auto light-scrollbar pr-2">
                {customers.length > 0 ? (
                    customers.map(customer => (
                        <CustomerCard key={customer.id} customer={customer} />
                    ))
                ) : (
                    <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg">
                        <p className="text-gray-500">No customers have been added yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}