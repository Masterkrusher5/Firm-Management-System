import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useFirmData } from '../../contexts/FirmDataContext';
import { pb, logErrorToPocketBase, formatDate } from '../../services/pocketbase';
import Loader from '../common/Loader';

export default function MarkDeliveredModal({ isOpen, onClose, saleToMark }) {
    const { refetchData } = useFirmData();
    const [actualDeliveryDate, setActualDeliveryDate] = useState('');
    const [deliveryProof, setDeliveryProof] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setActualDeliveryDate(new Date().toISOString().slice(0, 10)); 
            setDeliveryProof(null);
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!actualDeliveryDate) {
            alert("Please select the actual delivery date.");
            return;
        }
        setLoading(true);
        const updatedDeliveryObject = {
            ...saleToMark.delivery,
            status: 'DELIVERED',
            actualDeliveryDate: actualDeliveryDate,
        };
        const formData = new FormData();
        formData.append('delivery', JSON.stringify(updatedDeliveryObject));
        if (deliveryProof) {
            formData.append('delivery_proof', deliveryProof);
        }

        try {
            await pb.collection('sales').update(saleToMark.id, formData);
            alert('Delivery status successfully updated!');
            onClose();
            await refetchData();
        } catch (error) {
            logErrorToPocketBase({ message: "Failed to mark as delivered", stack: error.stack });
            alert(`Error updating status: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !saleToMark) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <form onSubmit={handleSubmit}>
                    <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-white">Confirm Delivery</h3>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-white text-3xl">&times;</button>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-blue-800">
                            <p className="text-sm">Customer: <strong className="text-blue-900">{saleToMark.customer_details?.name}</strong></p>
                            <p className="text-sm">Order: <strong className="text-blue-900">{saleToMark.order_number}</strong></p>
                        </div>
                        <div>
                            <label htmlFor="actual-delivery-date" className="block text-sm font-medium text-gray-600">Actual Delivery Date</label>
                            <input type="date" id="actual-delivery-date" value={actualDeliveryDate} onChange={e => setActualDeliveryDate(e.target.value)} className="mt-1 block w-full bg-gray-50 border-gray-300 rounded-md py-2 px-3" required />
                        </div>
                        <div>
                            <label htmlFor="delivery-proof" className="block text-sm font-medium text-gray-600">Delivery Proof (Optional)</label>
                            <input type="file" id="delivery-proof" onChange={e => setDeliveryProof(e.target.files[0])} accept="image/*,application/pdf" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                        </div>
                    </div>
                    <div className="bg-gray-100 px-6 py-4 flex justify-end gap-2">
                        <button type="button" onClick={onClose} disabled={loading} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md">Cancel</button>
                        <button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">
                            {loading ? <Loader size="sm" text="" /> : 'Confirm Delivered'}
                        </button>
                    </div>
                </form>
            </div>
        </Modal>
    );
}