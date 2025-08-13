import React, { useState, useEffect, useMemo } from 'react';
import { useFirmData } from '../../../contexts/FirmDataContext';
import { pb, inrFormatter } from '../../../services/pocketbase';

export default function SaleFormDetails({ saleCart, selectedCustomer, setSelectedCustomer, onCompleteSale, isLoading }) {
    const { firmId, customers } = useFirmData();
    const [sellerName, setSellerName] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [deliveryDate, setDeliveryDate] = useState('');
    const [discountValue, setDiscountValue] = useState('');
    const [discountType, setDiscountType] = useState('percent'); 
    const [amountPaid, setAmountPaid] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [paymentProof, setPaymentProof] = useState(null);

    const financials = useMemo(() => {
        const subtotal = saleCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const discountInput = parseFloat(discountValue) || 0;
        let calculatedDiscount = (discountType === 'percent') ? (subtotal * discountInput) / 100 : discountInput;
        calculatedDiscount = Math.min(subtotal, calculatedDiscount);
        const grandTotal = subtotal - calculatedDiscount;
        const paidInput = parseFloat(amountPaid) || 0;
        const amountDue = grandTotal - paidInput;
        return { subtotal, calculatedDiscount, grandTotal, amountDue };
    }, [saleCart, discountValue, discountType, amountPaid]);

    useEffect(() => {
        if (financials.grandTotal > 0 && amountPaid === '') {
            setAmountPaid(financials.grandTotal.toFixed(2));
        }
    }, [financials.grandTotal]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedCustomer || saleCart.length === 0 || !sellerName || !deliveryDate || !orderNumber) {
            alert('Please fill all required fields (Customer, Seller, Order #, Delivery Date) and add items to the cart.');
            return;
        }

        const customerDetails = customers.find(c => c.id === selectedCustomer);
        const saleData = {
            firm_id: firmId,
            order_number: orderNumber,
            seller_name: sellerName,
            customer_id: customerDetails.id,
            customer_details: JSON.stringify({ name: customerDetails.name, phone: customerDetails.phone, email: customerDetails.email || '', address: customerDetails.address || '' }),
            items: JSON.stringify(saleCart.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price, item_code: i.item_code || null }))),
            discount: JSON.stringify({ type: discountType, value: parseFloat(discountValue) || 0, calculated: financials.calculatedDiscount }),
            payment: JSON.stringify({
                subtotal: financials.subtotal,
                total: financials.grandTotal,
                paid: parseFloat(amountPaid) || 0,
                due: financials.amountDue,
                method: paymentMethod,
                dueDate: financials.amountDue > 0 ? dueDate : null
            }),
            delivery: JSON.stringify({ deliveryDate: deliveryDate, status: 'PENDING' }),
            status: financials.amountDue <= 0.01 ? 'PAID' : 'PARTIAL',
            payment_proofs: paymentProof, 
        };

        const formData = new FormData();
        Object.keys(saleData).forEach(key => {
            formData.append(key, saleData[key]);
        });

        onCompleteSale(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
             <div className="mb-4">
                <label htmlFor="sale-customer-select" className="font-semibold text-gray-800 mb-2">Customer</label>
                <select 
                    id="sale-customer-select" 
                    value={selectedCustomer} 
                    onChange={(e) => setSelectedCustomer(e.target.value)} 
                    required 
                    className="block w-full bg-gray-50 border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800"
                >
                    <option value="" disabled>Select an existing customer</option>
                    {customers.map(cust => (
                        <option key={cust.id} value={cust.id}>
                            {cust.name} - {cust.phone}
                        </option>
                    ))}
                </select>
            </div>
            <div className="mb-4">
                <h4 className="font-semibold text-gray-800 mb-2">Sale & Delivery Details</h4>
                <div className="bg-gray-100 p-4 rounded-lg space-y-3">
                    <div>
                        <label htmlFor="seller-name" className="block text-sm font-medium text-gray-600">Seller Name</label>
                        <input type="text" id="seller-name" value={sellerName} onChange={e => setSellerName(e.target.value)} placeholder="Enter seller's name" className="mt-1 block w-full bg-white border-gray-300 rounded-md py-2 px-3" required />
                    </div>
                    <div>
                        <label htmlFor="order-number-input" className="block text-sm font-medium text-gray-600">Order Number</label>
                        <input type="text" id="order-number-input" value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="e.g., #12345 or INV-001" className="mt-1 block w-full bg-white border-gray-300 rounded-md py-2 px-3" required />
                    </div>
                    <div>
                        <label htmlFor="delivery-date" className="block text-sm font-medium text-gray-600">Expected Delivery Date</label>
                        <input type="date" id="delivery-date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="mt-1 block w-full bg-white border-gray-300 rounded-md py-2 px-3" required />
                    </div>
                </div>
            </div>
            <h4 className="font-semibold text-gray-800 mb-2">Payment Details</h4>
            <div className="bg-gray-100 p-4 rounded-lg space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600">Subtotal</label>
                    <p className="text-xl font-bold text-gray-800 mt-1">{inrFormatter.format(financials.subtotal)}</p>
                </div>
                <div className="flex items-end gap-2">
                    <div className="flex-grow">
                        <label htmlFor="sale-discount-value" className="block text-sm font-medium text-gray-600">Discount</label>
                        <input type="number" id="sale-discount-value" value={discountValue} onChange={e => setDiscountValue(e.target.value)} min="0" placeholder="0" className="mt-1 block w-full bg-white border-gray-300 rounded-md py-2 px-3" />
                    </div>
                    <div>
                        <label htmlFor="sale-discount-type" className="block text-sm font-medium text-gray-600">Type</label>
                        <select id="sale-discount-type" value={discountType} onChange={e => setDiscountType(e.target.value)} className="mt-1 block w-full bg-white border-gray-300 rounded-md py-2 px-3">
                            <option value="percent">%</option>
                            <option value="cash">₹</option>
                        </select>
                    </div>
                </div>
                {financials.calculatedDiscount > 0 && <p className="text-sm text-green-600 font-medium">Discount Applied: {inrFormatter.format(financials.calculatedDiscount)}</p>}
                <hr/>
                <div>
                    <label className="block text-sm font-medium text-gray-600">Grand Total</label>
                    <p className="text-2xl font-bold text-gray-800 mt-1">{inrFormatter.format(financials.grandTotal)}</p>
                </div>
                <div>
                    <label htmlFor="sale-amount-paid" className="block text-sm font-medium text-gray-600">Amount Paid</label>
                    <input type="number" id="sale-amount-paid" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} min="0" step="0.01" className="mt-1 block w-full bg-white border-gray-300 rounded-md py-2 px-3" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600">Amount Due</label>
                    <p className="text-xl font-bold text-yellow-600 mt-1">{inrFormatter.format(financials.amountDue)}</p>
                </div>
                {financials.amountDue > 0 && (
                     <div>
                        <label htmlFor="sale-due-date" className="block text-sm font-medium text-gray-600">Collection Date</label>
                        <input type="date" id="sale-due-date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 block w-full bg-white border-gray-300 rounded-md py-2 px-3" />
                     </div>
                )}
                <div>
                    <label htmlFor="sale-payment-method" className="block text-sm font-medium text-gray-600">Payment Method</label>
                    <select id="sale-payment-method" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="mt-1 block w-full bg-white border-gray-300 rounded-md py-2 px-3">
                        <option>Cash</option><option>Card</option><option>Online</option><option>Mixed</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="sale-payment-proof" className="block text-sm font-medium text-gray-600">Payment Proof (Image)</label>
                    <input type="file" id="sale-payment-proof" onChange={e => setPaymentProof(e.target.files[0])} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">
                    {isLoading ? 'Processing...' : 'Complete Sale'}
                </button>
            </div>
        </form>
    );
}