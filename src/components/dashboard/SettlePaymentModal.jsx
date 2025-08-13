import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal'; 
import { useFirmData } from '../../contexts/FirmDataContext';
import { pb, inrFormatter, logErrorToPocketBase } from '../../services/pocketbase';
import Loader from '../common/Loader';

/**
 * @param {object} props
 * @param {boolean} props.isOpen 
 * @param {function} props.onClose 
 * @param {object | null} props.saleToSettle 
 */
export default function SettlePaymentModal({ isOpen, onClose, saleToSettle }) {
    const { refetchData } = useFirmData();
    const [amountPaidNow, setAmountPaidNow] = useState('');
    const [paymentProof, setPaymentProof] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (saleToSettle) {
            
            setAmountPaidNow(saleToSettle.payment?.due?.toFixed(2) || '');
            setPaymentProof(null); 
            setLoading(false);     
        }
    }, [saleToSettle]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const amountToPay = parseFloat(amountPaidNow);

        if (isNaN(amountToPay) || amountToPay <= 0) {
            alert('Please enter a valid amount to pay.');
            return;
        }

        setLoading(true);
        try {
            const currentPayment = saleToSettle.payment || {};
            const totalPaid = (currentPayment.paid || 0) + amountToPay;
            const newDue = currentPayment.total - totalPaid;

            
            const updatedPaymentObject = {
                ...currentPayment,
                paid: totalPaid,
                due: newDue,
            };
            const formData = new FormData();
            formData.append('payment', JSON.stringify(updatedPaymentObject));
            if (newDue <= 0.01) {
                formData.append('status', 'PAID');
            }
            const existingProofs = saleToSettle.payment_proofs || [];
            existingProofs.forEach(fileName => {
                formData.append('payment_proofs', fileName);
            });
            if (paymentProof) {
                formData.append('payment_proofs', paymentProof);
            }
            await pb.collection('sales').update(saleToSettle.id, formData);
            alert('Payment successfully settled!');
            onClose(); 
            await refetchData(); 

        } catch (error) {
            logErrorToPocketBase({ message: "Payment settlement failed", stack: error.stack });
            alert(`Failed to update payment: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    if (!isOpen || !saleToSettle) {
        return null;
    }
    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleSubmit}>
                    <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-white">Settle Due Payment</h3>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-800 space-y-1">
                            <p className="text-sm">Customer: <strong className="text-yellow-900">{saleToSettle.customer_details?.name}</strong></p>
                            <p className="text-sm">Order: <strong className="text-yellow-900">{saleToSettle.order_number}</strong></p>
                            <p className="text-sm font-semibold">Total Due: <strong className="text-yellow-900">{inrFormatter.format(saleToSettle.payment?.due)}</strong></p>
                        </div>
                        <div>
                            <label htmlFor="settle-amount-paid" className="block text-sm font-medium text-gray-600">Amount to Pay Now</label>
                            <input
                                type="number"
                                id="settle-amount-paid"
                                value={amountPaidNow}
                                onChange={e => setAmountPaidNow(e.target.value)}
                                min="0.01"
                                max={saleToSettle.payment?.due || 0}
                                step="0.01"
                                className="mt-1 block w-full bg-gray-50 border-gray-300 rounded-md py-2 px-3"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="settle-payment-proof" className="block text-sm font-medium text-gray-600">Add New Payment Proof (Optional)</label>
                            <input
                                type="file"
                                id="settle-payment-proof"
                                onChange={e => setPaymentProof(e.target.files[0])}
                                accept="image/*"
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                            />
                        </div>
                    </div>
                    <div className="bg-gray-100 px-6 py-4 flex justify-end gap-2">
                        <button type="button" onClick={onClose} disabled={loading} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md">
                            Cancel
                        </button>
                        <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">
                            {loading ? <Loader size="sm" text="" /> : 'Confirm Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}