import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useFirmData } from '../../../contexts/FirmDataContext';
import { useAuth } from '../../../contexts/AuthContext';
import { pb, inrFormatter, getFileUrl, logErrorToPocketBase, formatDate } from '../../../services/pocketbase';
import Loader from '../../common/Loader';

const DepositForm = ({ onSuccess }) => {
    const { firmId } = useFirmData();
    const { currentUser } = useAuth();
    const [amount, setAmount] = useState('');
    const [type, setType] = useState('Cash');
    const [notes, setNotes] = useState('');
    const [proof, setProof] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!amount || amount <= 0) {
            alert("Please enter a valid deposit amount.");
            return;
        }
        setLoading(true);

        const formData = new FormData();
        formData.append('firm_id', firmId);
        formData.append('amount', amount);
        formData.append('type', type);
        formData.append('notes', notes);
        formData.append('logged_by', currentUser?.email || 'unknown@staff.com');
        formData.append('deposit_date', new Date().toISOString());
        if (proof) {
            formData.append('proof', proof);
        }

        try {
            await pb.collection('deposits').create(formData);   
            e.target.reset();
            setAmount('');
            setType('Cash');
            setNotes('');
            setProof(null);
            onSuccess();

        } catch (error) {
            logErrorToPocketBase({ message: "Staff Deposit creation failed", stack: error.stack });
            alert(`Failed to log deposit: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow h-fit">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Log New Deposit</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><label htmlFor="deposit-amount" className="block text-sm font-medium text-gray-600">Amount (₹)</label><input type="number" id="deposit-amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full bg-gray-50 rounded-md py-2 px-3" required min="1" /></div>
                <div><label htmlFor="deposit-type" className="block text-sm font-medium text-gray-600">Deposit Type</label><select id="deposit-type" value={type} onChange={(e) => setType(e.target.value)} className="mt-1 block w-full bg-gray-50 rounded-md py-2 px-3"><option>Cash</option><option>Card</option><option>Online</option></select></div>
                <div><label htmlFor="deposit-notes" className="block text-sm font-medium text-gray-600">Notes</label><textarea id="deposit-notes" rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 block w-full bg-gray-50 rounded-md py-2 px-3"></textarea></div>
                <div><label htmlFor="deposit-proof" className="block text-sm font-medium text-gray-600">Deposit Proof</label><input type="file" id="deposit-proof" onChange={(e) => setProof(e.target.files[0])} className="mt-1 block w-full text-sm"/></div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">{loading ? <Loader size="sm" text="" /> : 'Log Deposit'}</button>
            </form>
        </div>
    );
};

const DepositHistoryList = ({ deposits }) => {
    const sortedDeposits = [...deposits].sort((a, b) => new Date(b.deposit_date) - new Date(a.deposit_date));

    return (
        <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Deposit History</h2>
            <div className="space-y-4 max-h-[70vh] overflow-y-auto light-scrollbar">
                {sortedDeposits.length > 0 ? (
                    sortedDeposits.map(dep => {
                        const proofUrl = getFileUrl(dep, 'proof');
                        return (
                            <div key={dep.id} className="p-3 rounded-lg bg-gray-50 border">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-gray-800">{dep.type} Deposit</p>
                                        <p className="text-xs text-gray-500">{formatDate(dep.deposit_date)}</p>
                                        {dep.notes && <p className="text-sm mt-1 text-gray-600">{dep.notes}</p>}
                                    </div>
                                    <p className="font-bold text-lg text-blue-600">{inrFormatter.format(dep.amount)}</p>
                                </div>
                                {proofUrl && (<div className="mt-2 border-t pt-2"><a href={proofUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">View Proof</a></div>)}
                            </div>
                        );
                    })
                ) : (
                    <p className="text-gray-500 p-4 text-center">No deposits have been logged.</p>
                )}
            </div>
        </div>
    );
};

export default function DepositsTab() {    
    const { sales, expenses, firmId } = useFirmData();
    const [localDeposits, setLocalDeposits] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const fetchDeposits = useCallback(async () => {
        if (!firmId) return;
        try {
            const depositRecords = await pb.collection('deposits').getFullList({
                filter: `firm_id="${firmId}"`,
                fields: '*',
                $autoCancel: false, 
            });
            setLocalDeposits(depositRecords);
        } catch (error) {
            console.error("Failed to fetch local deposits:", error);
            logErrorToPocketBase({ message: "Failed to fetch deposits in DepositsTab", stack: error.stack });
        } finally {
            setIsLoading(false);
        }
    }, [firmId]); 
    useEffect(() => {
        fetchDeposits();
    }, [fetchDeposits]);

    const inHandCash = useMemo(() => {
        const totalCashSales = sales.filter(s => s.payment?.method === 'Cash' || s.payment?.method === 'Mixed').reduce((sum, doc) => sum + (doc.payment?.paid || 0), 0);
        const totalApprovedExpenses = expenses.filter(e => e.status === 'approved').reduce((sum, doc) => sum + doc.amount, 0);
        const totalCashDeposits = localDeposits.filter(d => d.type === 'Cash').reduce((sum, doc) => sum + doc.amount, 0);
        return totalCashSales - totalApprovedExpenses - totalCashDeposits;
    }, [sales, expenses, localDeposits]); 

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg-col-span-1 space-y-8">
                <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="text-gray-500 text-sm font-medium uppercase">Current In-Hand Cash</h3>
                    <p className="text-4xl font-bold text-green-600 mt-2">{inrFormatter.format(inHandCash)}</p>
                </div>
                <DepositForm onSuccess={fetchDeposits} />
            </div>
            <div className="lg:col-span-2">
                {isLoading ? <Loader text="Loading History..." /> : <DepositHistoryList deposits={localDeposits} />}
            </div>
        </div>
    );
}