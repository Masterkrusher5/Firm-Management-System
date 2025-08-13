import React, { useState, useMemo } from 'react';
import { useFirmData } from '../../../contexts/FirmDataContext';
import { pb, logErrorToPocketBase, inrFormatter } from '../../../services/pocketbase';
import { FaPlus, FaTimes } from 'react-icons/fa';
import Loader from '../../common/Loader';

const InlineCustomerForm = ({ onSave, onCancel }) => {
    const [data, setData] = useState({ name: '', phone: '', email: '', address: '' });
    const [loading, setLoading] = useState(false);
    const { firmId } = useFirmData();

    const handleChange = (e) => setData({ ...data, [e.target.name]: e.target.value });

    const handleSave = async () => {
        if (!data.name || !data.phone) {
            alert('Customer Name and Phone are required.');
            return;
        }
        setLoading(true);
        try {
            const newCustomer = await pb.collection('customers').create({ ...data, firm_id: firmId });
            onSave(newCustomer); 
        } catch (error) {
            logErrorToPocketBase({ message: "Inline customer save failed", stack: error.stack });
            alert("Could not save new customer.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="my-4 p-4 border-2 border-dashed rounded-lg space-y-3 bg-gray-50">
            <h4 className="font-medium text-gray-700">Add New Customer Details</h4>
            <input type="text" name="name" onChange={handleChange} placeholder="Customer Name*" className="block w-full bg-white text-sm rounded-md py-2 px-3 border-gray-300" />
            <input type="tel" name="phone" onChange={handleChange} placeholder="Phone Number*" className="block w-full bg-white text-sm rounded-md py-2 px-3 border-gray-300" />
            <input type="email" name="email" onChange={handleChange} placeholder="Email Address" className="block w-full bg-white text-sm rounded-md py-2 px-3 border-gray-300" />
            <textarea name="address" onChange={handleChange} placeholder="Full Address" rows="2" className="block w-full bg-white text-sm rounded-md py-2 px-3 border-gray-300"></textarea>
            <div className="flex gap-2 justify-end">
                <button type="button" onClick={onCancel} className="text-sm bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded-md">Cancel</button>
                <button type="button" onClick={handleSave} disabled={loading} className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-md disabled:opacity-50">
                    {loading ? <Loader size="sm" text=""/> : 'Save Customer'}
                </button>
            </div>
        </div>
    );
};

const ItemSearch = ({ onAddItem }) => {
    const { items: allItems } = useFirmData();
    const [searchTerm, setSearchTerm] = useState('');

    const searchResults = useMemo(() => {
        if (searchTerm.length < 1) return [];
        const query = searchTerm.toLowerCase();
        return allItems.filter(item =>
            item.quantity > 0 &&
            (item.name.toLowerCase().includes(query) || (item.item_code && item.item_code.toLowerCase().includes(query)))
        ).slice(0, 5);
    }, [searchTerm, allItems]);

    const handleSelect = (item) => {
        onAddItem(item);
        setSearchTerm('');
    };

    return (
        <div className="mb-4 relative">
            <input type="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by Item Name or Code..." className="block w-full bg-gray-50 border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800" />
            {searchTerm && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg">
                    {searchResults.length > 0 ? (
                        searchResults.map(item => (
                            <div key={item.id} onClick={() => handleSelect(item)} className="p-2 border-b hover:bg-gray-100 cursor-pointer">
                                <p className="font-semibold text-gray-800">{item.name}</p>
                                <p className="text-xs text-gray-500">Code: {item.item_code || 'N/A'} | Stock: {item.quantity}</p>
                            </div>
                        ))
                    ) : (
                        <p className="p-2 text-gray-500 text-sm">No items found or out of stock.</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default function SaleCart({ saleCart, setSaleCart, onCustomerCreated }) {
    const { items: allItems } = useFirmData();
    const [showAddCustomer, setShowAddCustomer] = useState(false);
    

    const handleAddItemToCart = (item) => {
        if (item.quantity <= 0) {
            alert('Item is out of stock.');
            return;
        }

        const existingCartItem = saleCart.find(ci => ci.id === item.id);
        if (existingCartItem) {
            
            if (existingCartItem.quantity < item.quantity) {
                setSaleCart(cart => cart.map(ci => ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci));
            } else {
                alert('No more stock available for this item.');
            }
        } else {
            setSaleCart(cart => [...cart, { ...item, quantity: 1 }]);
        }
    };

    const handleQuantityChange = (itemId, newQty) => {
        const itemInStock = allItems.find(i => i.id === itemId);
        const quantity = Math.max(1, parseInt(newQty) || 1); 

        if (quantity > itemInStock.quantity) {
            alert(`Cannot add more than available stock (${itemInStock.quantity}).`);
            setSaleCart(cart => cart.map(ci => ci.id === itemId ? { ...ci, quantity: itemInStock.quantity } : ci));
            return;
        }
        setSaleCart(cart => cart.map(ci => ci.id === itemId ? { ...ci, quantity } : ci));
    };

    const handleRemoveItem = (itemId) => {
        setSaleCart(cart => cart.filter(ci => ci.id !== itemId));
    };

    return (
        <div>
            <div className="mb-4">
                <label className="font-semibold text-gray-800 mb-2 flex justify-between items-center">
                    Customer
                    <button type="button" onClick={() => setShowAddCustomer(true)} className="text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-2 py-1 rounded-full flex items-center gap-1">
                        <FaPlus size={10} /> New Customer
                    </button>
                </label>
                {showAddCustomer && (
                    <InlineCustomerForm 
                        onSave={(newCustomer) => {
                            onCustomerCreated(newCustomer);
                            setShowAddCustomer(false);
                        }} 
                        onCancel={() => setShowAddCustomer(false)}
                    />
                )}
            </div>

            <div className="mb-4">
                <label className="font-semibold text-gray-800 mb-2">Add Items to Sale</label>
                <ItemSearch onAddItem={handleAddItemToCart} />
            </div>

            <div>
                <h4 className="font-semibold text-gray-800 mb-2">Sale Cart</h4>
                <div className="space-y-2 border rounded-md p-2 min-h-[100px] bg-gray-50">
                    {saleCart.length === 0 ? (
                        <p className="text-gray-500 text-center p-4">Add items to the cart</p>
                    ) : (
                        saleCart.map(item => (
                            <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm">
                                <div>
                                    <p className="font-semibold text-gray-800">{item.name}</p>
                                    <p className="text-xs text-gray-500">{inrFormatter.format(item.price)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                        className="cart-item-qty w-16 text-center border rounded-md py-1"
                                        min="1"
                                        max={allItems.find(i => i.id === item.id)?.quantity || 1}
                                    />
                                    <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700 p-1">
                                        <FaTimes />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}