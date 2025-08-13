import React, { useState, useEffect } from 'react';
import Modal from '../../common/Modal';
import SaleCart from './SaleCart';
import SaleFormDetails from './SaleFormDetails';
import { pb, logErrorToPocketBase, createActivityLog, inrFormatter } from '../../../services/pocketbase';
import { useFirmData } from '../../../contexts/FirmDataContext';
import Loader from '../../common/Loader';

export default function SaleModal({ isOpen, onClose }) {
    const { refetchData } = useFirmData();
    const [saleCart, setSaleCart] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setSaleCart([]);
            setSelectedCustomer('');
            setLoading(false);
        }
    }, [isOpen]);

    const handleCompleteSale = async (finalSaleData) => {
        setLoading(true);
        try {
            for (const cartItem of saleCart) {
                await pb.collection('items').update(cartItem.id, {
                    "quantity-": cartItem.quantity,
                    "sales+": cartItem.quantity
                });
            }

            const newSaleRecord = await pb.collection('sales').create(finalSaleData);
            const saleTotal = inrFormatter.format(newSaleRecord.payment?.total || 0);
            const customerName = newSaleRecord.customer_details?.name || 'Unknown Customer';
            createActivityLog(`Completed sale #${newSaleRecord.order_number} to ${customerName} for ${saleTotal}.`);
            
            onClose();
            await refetchData();

        } catch (error) {
            logErrorToPocketBase({ message: "Sale creation failed", stack: error.stack, source: 'SaleModal.jsx' });
            alert('CRITICAL ERROR: Could not complete the sale. Inventory may be out of sync. Please check manually and contact support.');
            setLoading(false);
        }
    };

    const handleCustomerCreated = (newCustomer) => {
        refetchData().then(() => {
            setSelectedCustomer(newCustomer.id);
        });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="inline-block bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all my-8 align-middle max-w-4xl w-full">
                <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white">Create New Sale</h3>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                </div>
                <div className="relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/70 z-20">
                            <Loader fullScreen text="Processing Sale..."/>
                        </div>
                    )}
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[75vh] overflow-y-auto light-scrollbar">
                        <SaleCart
                            saleCart={saleCart}
                            setSaleCart={setSaleCart}
                            onCustomerCreated={handleCustomerCreated}
                        />
                        <SaleFormDetails
                            saleCart={saleCart}
                            selectedCustomer={selectedCustomer}
                            setSelectedCustomer={setSelectedCustomer}
                            onCompleteSale={handleCompleteSale}
                            isLoading={loading}
                        />
                    </div>
                </div>
                <div className="bg-gray-100 px-6 py-4 flex justify-end">
                    <button type="button" onClick={onClose} className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md mr-2">
                        Cancel
                    </button>
                </div>
            </div>
        </Modal>
    );
}