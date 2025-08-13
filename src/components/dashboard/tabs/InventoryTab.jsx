import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { useFirmData } from '../../../contexts/FirmDataContext';
import { pb, logErrorToPocketBase, inrFormatter } from '../../../services/pocketbase';
import { FaPencilAlt, FaTrash, FaPlus } from 'react-icons/fa';
import ItemForm from '../ItemForm';
import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';
import SaleModal from '../Salemodal/SaleModal';
import Loader from '../../common/Loader';

const ExcelImport = ({ onSuccess }) => {
    const { firmId } = useFirmData();
    const [loading, setLoading] = useState(false);
    const handleImport = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        setLoading(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);

                if (json.length === 0) {
                    alert("The Excel file is empty or could not be read.");
                    return;
                }
                for (const row of json) {
                    const itemName = row['Item Name'] || row['name'];
                    if (!itemName) continue; 

                    const newItem = {
                        firm_id: firmId,
                        name: itemName,
                        hsn_sac: row['HSN/SAC'] || row['hsn_sac'] || '',
                        item_code: row['Item Code'] || row['item_code'] || '',
                        price: 0, 
                        quantity: 0, 
                        sales: 0,
                    };
                    await pb.collection('items').create(newItem);
                }
                alert(`Successfully imported ${json.length} items. Please update their price and quantity.`);
                onSuccess(); 
            } catch (err) {
                logErrorToPocketBase({ message: 'Excel import failed', stack: err.stack });
                alert("An error occurred during import. Please check the console and ensure your file format is correct.");
            } finally {
                setLoading(false);
            }
        };
        reader.readAsArrayBuffer(file);
        event.target.value = null; 
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow h-fit">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Import from Excel</h2>
            <div className="space-y-4">
                <div>
                    <label htmlFor="excel-file-input" className="block text-sm font-medium text-gray-600">Excel File (.xlsx)</label>
                    <input type="file" id="excel-file-input" onChange={handleImport} accept=".xlsx, .xls" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                </div>
                <p className="text-xs text-gray-500">
                    Required columns: <strong>Item Name</strong>, <strong>HSN/SAC</strong>, <strong>Item Code</strong>. Price and quantity will be set to 0.
                </p>
                {loading && <Loader text="Importing..." />}
            </div>
        </div>
    );
};
export default function InventoryTab() {
    const { items, refetchData } = useFirmData();
    const [editingItem, setEditingItem] = useState(null); 
    const [itemToDelete, setItemToDelete] = useState(null); 
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaleModalOpen, setSaleModalOpen] = useState(false);
    const handleEdit = (item) => {
        setEditingItem(item);
        
        document.getElementById('item-form-container')?.scrollIntoView({ behavior: 'smooth' });
    };
    const handleDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            await pb.collection('items').delete(itemToDelete);
            await refetchData(); 
        } catch (error) {
            logErrorToPocketBase({ message: "Item deletion failed", stack: error.stack });
            alert("Error deleting item.");
        } finally {
            setItemToDelete(null); 
            setIsDeleting(false);
        }
    };
    return (
        <>
            <main className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div id="item-form-container" className="xl:col-span-1 flex flex-col gap-8">
                    <ItemForm 
                        key={editingItem ? editingItem.id : 'new-item'} 
                        editingItem={editingItem} 
                        onSuccess={() => {
                            setEditingItem(null); 
                            refetchData();
                        }} 
                        onCancel={() => setEditingItem(null)} 
                    />
                    <ExcelImport onSuccess={refetchData} />
                </div>
                <div className="xl:col-span-2 bg-white p-6 rounded-lg shadow">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold text-gray-800">Inventory List</h2>
                        <button onClick={() => setSaleModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md flex items-center gap-2">
                            <FaPlus />New Sale
                        </button>
                    </div>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto light-scrollbar pr-2">
                        {items.length > 0 ? items.map(item => (
                            <div key={item.id} className={`bg-gray-50 p-3 rounded-lg flex justify-between items-center text-gray-800 border ${item.quantity === 0 ? 'opacity-60' : ''}`}>
                                <div>
                                    <h3 className="font-semibold">{item.name} <span className="text-sm text-gray-500">({item.item_code || 'N/A'})</span></h3>
                                    <p className="text-gray-600 text-sm">HSN/SAC: {item.hsn_sac || 'N/A'}</p>
                                    <p className="text-gray-600 text-sm">{inrFormatter.format(Number(item.price))} - Qty: {item.quantity} - Sold: {item.sales || 0}</p>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <button onClick={() => handleEdit(item)} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold p-2 rounded text-xs"><FaPencilAlt /></button>
                                    <button onClick={() => setItemToDelete(item.id)} className="bg-red-500 hover:bg-red-600 text-white font-bold p-2 rounded text-xs"><FaTrash /></button>
                                </div>
                            </div>
                        )) : (
                             <p className="text-gray-500 p-4 text-center">No items in inventory.</p>
                        )}
                    </div>
                </div>
            </main>
            <DeleteConfirmationModal
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                onConfirm={handleDelete}
                isProcessing={isDeleting}
                title="Delete Item"
                message="Are you sure you want to delete this item? This action cannot be undone."
            />    
            <SaleModal
                isOpen={isSaleModalOpen}
                onClose={() => setSaleModalOpen(false)}
            />
        </>
    );
}