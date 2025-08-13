import React, { useState, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { pb, inrFormatter, getFileUrl, logErrorToPocketBase, formatDate } from '../../../services/pocketbase';
import Loader from '../../common/Loader';

const DepositForm = ({ firmId, onSuccess }) => {
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
        formData.append('logged_by', currentUser?.email || 'unknown@admin.com');
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
            logErrorToPocketBase({ message: "Admin Deposit creation failed", stack: error.stack });
            alert(`Failed to log deposit: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-700 p-6 rounded-lg h-fit">
            <h2 className="text-2xl font-semibold mb-4 text-gray-200">Log New Deposit</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><label htmlFor="admin-deposit-amount" className="block text-sm font-medium text-gray-400">Amount (₹)</label><input type="number" id="admin-deposit-amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 block w-full bg-gray-600 text-white rounded-md py-2 px-3" required min="1" /></div>
                <div><label htmlFor="admin-deposit-type" className="block text-sm font-medium text-gray-400">Deposit Type</label><select id="admin-deposit-type" value={type} onChange={(e) => setType(e.target.value)} className="mt-1 block w-full bg-gray-600 text-white rounded-md py-2 px-3"><option>Cash</option><option>Card</option><option>Online</option></select></div>
                <div><label htmlFor="admin-deposit-notes" className="block text-sm font-medium text-gray-400">Notes</label><textarea id="admin-deposit-notes" rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 block w-full bg-gray-600 text-white rounded-md py-2 px-3"></textarea></div>
                <div><label htmlFor="admin-deposit-proof" className="block text-sm font-medium text-gray-400">Deposit Proof</label><input type="file" id="admin-deposit-proof" onChange={(e) => setProof(e.target.files[0])} className="mt-1 block w-full text-sm text-gray-300" /></div>
                <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">{loading ? 'Logging...' : 'Log Deposit'}</button>
            </form>
        </div>
    );
};

const DepositHistoryItem = ({ deposit }) => {
    const proofUrl = getFileUrl(deposit, 'proof');
    return (
        <div className="p-3 rounded-lg bg-gray-700">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-semibold text-white">{deposit.type} Deposit</p>
                    <p className="text-xs text-gray-400">{formatDate(deposit.deposit_date)}</p>
                    {deposit.notes && <p className="text-sm mt-1 text-gray-300">{deposit.notes}</p>}
                </div>
                <p className="font-bold text-lg text-blue-400">{inrFormatter.format(deposit.amount)}</p>
            </div>
            {proofUrl && (<div className="mt-2 border-t border-gray-600 pt-2"><a href={proofUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">View Proof</a></div>)}
        </div>
    );
};

export default function AdminDepositsTab({ firmId, deposits, sales, expenses, onUpdate }) {
    const inHandCash = useMemo(() => {
        if (!sales || !expenses || !deposits) return 0;
        const totalCashSales = sales.filter(s => s.payment?.method === 'Cash' || s.payment?.method === 'Mixed').reduce((sum, doc) => sum + (doc.payment?.paid || 0), 0);
        const totalApprovedExpenses = expenses.filter(e => e.status === 'approved').reduce((sum, doc) => sum + doc.amount, 0);
        const totalCashDeposits = deposits.filter(d => d.type === 'Cash').reduce((sum, doc) => sum + doc.amount, 0);
        return totalCashSales - totalApprovedExpenses - totalCashDeposits;
    }, [sales, expenses, deposits]);

    const sortedDeposits = useMemo(() => {
        if (!deposits) return [];
        return [...deposits].sort((a, b) => new Date(b.deposit_date) - new Date(a.deposit_date))
    }, [deposits]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-8">
                <div className="bg-gray-700 p-6 rounded-lg">
                    <h3 className="text-gray-400 text-sm font-medium uppercase">Current In-Hand Cash</h3>
                    <p className="text-4xl font-bold text-green-400 mt-2">{inrFormatter.format(inHandCash)}</p>
                </div>
                {/*  */}
                <DepositForm firmId={firmId} onSuccess={onUpdate} />
            </div>
            <div className="lg:col-span-2 bg-gray-800 p-6 rounded-lg">
                <h2 className="text-2xl font-semibold mb-4 text-gray-200">Deposit History</h2>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {sortedDeposits.length > 0 ? (
                        sortedDeposits.map(dep => <DepositHistoryItem key={dep.id} deposit={dep} />)
                    ) : (
                        <p className="text-gray-400 p-4 text-center">No deposits have been logged for this firm.</p>
                    )}
                </div>
            </div>
        </div>
    );
}