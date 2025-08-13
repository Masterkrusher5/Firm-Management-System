import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { useAuth } from '../../../contexts/AuthContext';
import { pb, logErrorToPocketBase } from '../../../services/pocketbase';
import Loader from '../../common/Loader';
import DeleteFirmModal from '../DeleteFirmModal'; 

const CreateFirmForm = ({ onSuccess }) => {
    const [name, setName] = useState('');
    const [secretCode, setSecretCode] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await pb.collection('firms').create({ name, secret_code: secretCode });
            alert(`Successfully created firm: ${name}`);
            setName('');
            setSecretCode('');
            onSuccess(); 
        } catch (error) {
            logErrorToPocketBase({ message: 'Firm creation failed', stack: error.stack });
            alert(`Failed to create firm. Error: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-200">Create New Firm</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="firm-name" className="block text-sm font-medium text-gray-400">Firm Name</label>
                    <input type="text" id="firm-name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3" required />
                </div>
                <div>
                    <label htmlFor="secret-code" className="block text-sm font-medium text-gray-400">Secret Code</label>
                    <input type="text" id="secret-code" value={secretCode} onChange={(e) => setSecretCode(e.target.value)} className="mt-1 block w-full bg-gray-700 border-gray-600 rounded-md py-2 px-3" required />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">
                    {loading ? 'Creating...' : 'Create Firm'}
                </button>
            </form>
        </div>
    );
};

const FirmList = ({ firms, onDeleteClick }) => (
    <div>
        <h2 className="text-2xl font-semibold mb-4 text-gray-200">Existing Firms</h2>
        <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
            {firms.map(firm => (
                <div key={firm.id} className="bg-gray-700 p-3 rounded-md flex justify-between items-center">
                    <div>
                        <p className="font-semibold">{firm.name}</p>
                        <p className="text-sm text-gray-400">Code: {firm.secret_code}</p>
                    </div>
                    <button onClick={() => onDeleteClick(firm)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-xs">
                        Delete
                    </button>
                </div>
            ))}
        </div>
    </div>
);

export default function ManageFirmsTab({ onUpdate: onListUpdate, selectedFirmId, firms, selectedFirmData }) {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [firmToDelete, setFirmToDelete] = useState(null);
    const [isExporting, setIsExporting] = useState(false);

    const isSuperAdmin = currentUser?.role === 'super-admin';
    const selectedFirmName = firms.find(f => f.id === selectedFirmId)?.name || '';

    const handleExportSellerSummary = () => {
        if (!selectedFirmData?.sales) {
            alert("No sales data available to export.");
            return;
        }
        setIsExporting(true);
        try {
            const salesBySeller = selectedFirmData.sales.reduce((acc, sale) => {
                const sellerName = sale.seller_name || 'Unknown';
                if (!acc[sellerName]) {
                    acc[sellerName] = { 'Seller Name': sellerName, 'Total Revenue (₹)': 0, 'Total Units Sold': 0 };
                }
                acc[sellerName]['Total Revenue (₹)'] += sale.payment?.paid || 0;
                acc[sellerName]['Total Units Sold'] += sale.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
                return acc;
            }, {});

            const dataToExport = Object.values(salesBySeller);
            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Seller Summary');
            XLSX.writeFile(workbook, `${selectedFirmName} - Seller Summary.xlsx`);
        } catch (e) {
            alert("Failed to export seller summary.");
            console.error("Export error:", e);
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportAllData = async () => {
        setIsExporting(true);
        try {
            const workbook = XLSX.utils.book_new();
            const collectionsToExport = ['items', 'sales', 'customers', 'expenses', 'deposits'];

            for (const coll of collectionsToExport) {
                const records = await pb.collection(coll).getFullList({ filter: `firm_id="${selectedFirmId}"` });
                if (records && records.length > 0) {
                    const sanitizedData = records.map(row => {
                        const { collectionId, collectionName, expand, ...rest } = row;
                        const newRow = {};
                        for (const key in rest) {
                            newRow[key] = typeof rest[key] === 'object' && rest[key] !== null ? JSON.stringify(rest[key]) : rest[key];
                        }
                        return newRow;
                    });
                    const worksheet = XLSX.utils.json_to_sheet(sanitizedData);
                    XLSX.utils.book_append_sheet(workbook, worksheet, coll.charAt(0).toUpperCase() + coll.slice(1));
                }
            }
            XLSX.writeFile(workbook, `${selectedFirmName} - All Data Export.xlsx`);
        } catch (e) {
            alert("Failed to export all data.");
            console.error("Export error:", e);
        } finally {
            setIsExporting(false);
        }
    };

    if (!isSuperAdmin) {
        return <div className="text-red-400 text-lg">You do not have permission to manage firms.</div>;
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side: Create & List */}
                <CreateFirmForm onSuccess={onListUpdate} />
                <div>
                    <FirmList firms={firms} onDeleteClick={setFirmToDelete} />

                    {/* Export Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 mt-4">
                        <button
                            onClick={handleExportSellerSummary}
                            disabled={!selectedFirmId || isExporting}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExporting ? 'Exporting...' : 'Export Seller Summary'}
                        </button>
                        <button
                            onClick={handleExportAllData}
                            disabled={!selectedFirmId || isExporting}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           {isExporting ? 'Exporting...' : 'Export All Data'}
                        </button>
                    </div>
                     {!selectedFirmId && <p className="text-xs text-gray-400 mt-2 text-center">Select a firm from the dropdown above to enable exports.</p>}
                </div>
            </div>

            <DeleteFirmModal
                firm={firmToDelete}
                isOpen={!!firmToDelete}
                onClose={() => setFirmToDelete(null)}
                onSuccess={() => {
                    setFirmToDelete(null);
                    onListUpdate(); 
                }}
            />
        </>
    );
}