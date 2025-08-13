import React, { useState, useEffect } from 'react';
import { useFirmData } from '../../contexts/FirmDataContext';
import { pb, logErrorToPocketBase, createActivityLog } from '../../services/pocketbase';
import Loader from '../common/Loader';

/**
 * @param {object} props
 * @param {object | null} props.editingItem
 * @param {function} props.onSuccess
 * @param {function} props.onCancel
 */
export default function ItemForm({ editingItem, onSuccess, onCancel }) {
    const { firmId } = useFirmData();
    const isEditing = !!editingItem;
    const [formData, setFormData] = useState({
        name: '',
        item_code: '',
        hsn_sac: '',
        price: '',
        quantity: ''
    });
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (isEditing) {
            setFormData({
                name: editingItem.name || '',
                item_code: editingItem.item_code || '',
                hsn_sac: editingItem.hsn_sac || '',
                price: editingItem.price || '',
                quantity: editingItem.quantity || ''
            });
        } else {
            
            setFormData({ name: '', item_code: '', hsn_sac: '', price: '', quantity: '' });
        }
    }, [editingItem, isEditing]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const dataToSubmit = { ...formData, firm_id: firmId };
        try {
            if (isEditing) {
                await pb.collection('items').update(editingItem.id, dataToSubmit);
                createActivityLog(`Updated inventory item: "${formData.name}" (Code: ${formData.item_code || 'N/A'}).`);
            } else {
                await pb.collection('items').create({ ...dataToSubmit, sales: 0 });
                createActivityLog(`Added new inventory item: "${formData.name}" (Code: ${formData.item_code || 'N/A'}).`);
            }
            onSuccess(); 
        } catch (error) {
            logErrorToPocketBase({ message: 'Item form submission failed', stack: error.stack, source: 'ItemForm.jsx' });
            alert('Failed to save item. The "Item Code" may already be in use. Please ensure it is unique.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow h-fit">
            <h2 id="form-title-dash" className="text-2xl font-semibold mb-4 text-gray-800">
                {isEditing ? 'Edit Item' : 'Add New Item'}
            </h2>
            <form id="item-form-dash" onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="item-name-dash" className="block text-sm font-medium text-gray-600">Item Name</label>
                    <input type="text" id="item-name-dash" name="name" value={formData.name} onChange={handleChange} placeholder="e.g., T-Shirt, Coffee Mug" className="mt-1 block w-full bg-gray-50 border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800" required />
                </div>
                <div>
                    <label htmlFor="item-code-dash" className="block text-sm font-medium text-gray-600">Item Code</label>
                    <input type="text" id="item-code-dash" name="item_code" value={formData.item_code} onChange={handleChange} placeholder="e.g., SKU-001" className="mt-1 block w-full bg-gray-50 border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800" />
                </div>
                <div>
                    <label htmlFor="item-hsn-sac-dash" className="block text-sm font-medium text-gray-600">HSN/SAC</label>
                    <input type="text" id="item-hsn-sac-dash" name="hsn_sac" value={formData.hsn_sac} onChange={handleChange} placeholder="e.g., 998314" className="mt-1 block w-full bg-gray-50 border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800" />
                </div>
                <div>
                    <label htmlFor="item-price-dash" className="block text-sm font-medium text-gray-600">Price (₹)</label>
                    <input type="number" id="item-price-dash" name="price" value={formData.price} onChange={handleChange} placeholder="e.g., 499" className="mt-1 block w-full bg-gray-50 border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800" required min="0" step="0.01" />
                </div>
                <div>
                    <label htmlFor="item-quantity-dash" className="block text-sm font-medium text-gray-600">Quantity</label>
                    <input type="number" id="item-quantity-dash" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="e.g., 100" className="mt-1 block w-full bg-gray-50 border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800" required min="0" />
                </div>
                <div className="flex justify-between items-center pt-2">
                    <button type="submit" id="submit-button-dash" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">
                        {loading ? <Loader size="sm" text="" /> : (isEditing ? 'Update Item' : 'Add Item')}
                    </button>
                    {isEditing && (
                        <button type="button" id="cancel-edit-dash" onClick={onCancel} className="ml-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-md">
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}