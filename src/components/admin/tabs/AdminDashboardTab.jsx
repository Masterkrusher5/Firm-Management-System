import React from 'react';
import { inrFormatter } from '../../../services/pocketbase';

/**
 *
 * @param {object} props 
 * @param {string} props.title
 * @param {number} props.value
 * @param {string} props.colorClass
 * @param {boolean} [props.isProfit=false]
 */
const StatCard = ({ title, value, colorClass, isProfit = false }) => {
    let finalColorClass = colorClass;
    if (isProfit) {
        finalColorClass = value >= 0 ? 'text-green-400' : 'text-red-400';
    }

    return (
        <div className="bg-gray-700 p-6 rounded-lg">
            <h3 className="text-gray-400 text-sm font-medium uppercase">{title}</h3>
            <p className={`text-3xl font-bold mt-2 ${finalColorClass}`}>
                {inrFormatter.format(value)}
            </p>
        </div>
    );
};

/**
 * 
 * @param {object[]} dues 
 */
const DuesByCustomerPanel = ({ dues }) => (
    <div className="bg-gray-700 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-200">Dues By Customer</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            {dues.length > 0 ? (
                dues.map(({ name, amount }) => (
                    <div key={name} className="bg-gray-900 p-2 rounded flex justify-between text-sm">
                        <span className="font-medium">{name}</span>
                        <span className="font-semibold text-yellow-400">{inrFormatter.format(amount)}</span>
                    </div>
                ))
            ) : (
                <p className="text-gray-400 text-center">No outstanding dues.</p>
            )}
        </div>
    </div>
);

/**
 * 
 * @param {object[]} deliveries
 */
const UpcomingDeliveriesPanel = ({ deliveries }) => (
    <div className="bg-gray-700 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-gray-200">Upcoming Deliveries</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            {deliveries.length > 0 ? (
                deliveries.map(sale => (
                    <div key={sale.id} className="bg-gray-900 p-3 rounded-lg">
                        <div className="flex justify-between items-center text-sm">
                            <p className="font-semibold text-gray-200">{sale.customer_details?.name || 'Unknown'}</p>
                            <p className="font-mono text-xs text-gray-400">
                                {new Date(sale.delivery.deliveryDate + 'T00:00:00').toLocaleDateString('en-IN')}
                            </p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Order: {sale.order_number}</p>
                    </div>
                ))
            ) : (
                <p className="text-gray-400 text-center">No pending deliveries.</p>
            )}
        </div>
    </div>
);

/**
 * 
 * @param {object[]} sellers
 */
const SalesBySellerPanel = ({ sellers }) => (
     <div className="bg-gray-700 p-6 rounded-lg xl:col-span-1">
        <h2 className="text-xl font-semibold mb-4 text-gray-200">Sales By Seller</h2>
        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
            {sellers.length > 0 ? (
                sellers.map(({ name, revenue, units }) => (
                     <div key={name} className="bg-gray-900 p-2 rounded text-sm">
                        <p className="font-medium">{name}</p>
                        <p className="text-xs text-gray-400">{units} items sold - {inrFormatter.format(revenue)}</p>
                    </div>
                ))
            ) : (
                 <p className="text-gray-400 text-center">No sales recorded for this firm.</p>
            )}
        </div>
    </div>
);


/**
 * 
 * @param {{ firmData: { sales: any[], expenses: any[] } | null }} props
 */
export default function AdminDashboardTab({ firmData }) {
    if (!firmData) {
        return <p className="text-gray-400">Firm data is loading or not available...</p>;
    }

    const { sales, expenses } = firmData;

    const totalRevenue = sales.reduce((sum, s) => sum + (s.payment?.paid || 0), 0);

    const totalExpenses = expenses
        .filter(e => e.status === 'approved')
        .reduce((sum, e) => sum + (e.amount || 0), 0);

    const netProfit = totalRevenue - totalExpenses;

    const totalDue = sales.reduce((sum, s) => sum + (s.payment?.due || 0), 0);

    const duesByCustomer = sales
        .filter(s => s.payment?.due > 0)
        .reduce((acc, sale) => {
            const customerName = sale.customer_details?.name || 'Unknown Customer';
            acc[customerName] = (acc[customerName] || 0) + sale.payment.due;
            return acc;
        }, {});
    
    const duesList = Object.entries(duesByCustomer).map(([name, amount]) => ({ name, amount }));
    const upcomingDeliveries = sales
        .filter(s => s.delivery?.status !== 'DELIVERED' && s.delivery?.deliveryDate)
        .sort((a, b) => new Date(a.delivery.deliveryDate) - new Date(b.delivery.deliveryDate));

    const salesBySeller = sales.reduce((acc, sale) => {
        const sellerName = sale.seller_name || 'Unknown Seller';
        if (!acc[sellerName]) {
            acc[sellerName] = { revenue: 0, units: 0 };
        }
        acc[sellerName].revenue += sale.payment?.paid || 0;
        acc[sellerName].units += sale.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
        return acc;
    }, {});

    const sellerList = Object.entries(salesBySeller).map(([name, data]) => ({ name, ...data }));

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-semibold text-gray-200">Firm Dashboard</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Revenue" value={totalRevenue} colorClass="text-green-400" />
                <StatCard title="Total Expenses" value={totalExpenses} colorClass="text-red-400" />
                <StatCard title="Net Profit" value={netProfit} colorClass="" isProfit={true} />
                <StatCard title="Total Amount Due" value={totalDue} colorClass="text-yellow-400" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                <DuesByCustomerPanel dues={duesList} />
                <UpcomingDeliveriesPanel deliveries={upcomingDeliveries} />
                <SalesBySellerPanel sellers={sellerList} />
            </div>
        </div>
    );
}