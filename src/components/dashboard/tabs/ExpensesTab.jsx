import React, { useState, useMemo } from 'react';
import { useFirmData } from '../../../contexts/FirmDataContext';
import { useAuth } from '../../../contexts/AuthContext';
import { pb, inrFormatter, getFileUrl, logErrorToPocketBase, formatDate } from '../../../services/pocketbase';
import Loader from '../../common/Loader';

const StatusBadge = ({ status }) => {    
    const statusStyles = {
        approved: { text: 'Approved', className: 'bg-green-100 text-green-700' },
        pending: { text: 'Pending Approval', className: 'bg-yellow-100 text-yellow-700' },
        rejected: { text: 'Rejected', className: 'bg-red-100 text-red-700' },
    };
    const style = statusStyles[status] || { text: 'Unknown', className: 'bg-gray-100 text-gray-700' };
    return <p className={`text-xs font-semibold inline-block px-2 py-1 rounded-full ${style.className}`}>{style.text}</p>;
};

const ExpenseForm = ({ onSuccess }) => {
    const { firmId } = useFirmData();
    const { currentUser } = useAuth();
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [proof, setProof] = useState(null);
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();   
        setLoading(true);
        const formData = new FormData();
        formData.append('firm_id', firmId);
        formData.append('submitted_by_uid', currentUser.id);
        formData.append('submitted_by_email', currentUser.email);
        formData.append('description', description);
        formData.append('amount', amount);
        formData.append('status', 'pending');
        if (proof) {
            formData.append('proof', proof);
        }
        formData.append('submission_date', new Date().toISOString());
        try {
            await pb.collection('expenses').create(formData);
            e.target.reset();
            setDescription('');
            setAmount('');
            setProof(null);
            alert('Expense submitted for approval.');
            onSuccess();
        } catch (error) {
            logErrorToPocketBase({ message: "Staff expense submission failed", stack: error.stack });
            alert(`Failed to submit expense: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="xl:col-span-1 bg-white p-6 rounded-lg shadow h-fit">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Log New Expense</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div><label htmlFor="expense-description" className="block text-sm font-medium text-gray-600">Description</label><input type="text" id="expense-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Office Rent, Electricity Bill" className="mt-1 block w-full bg-gray-50 rounded-md py-2 px-3 border-gray-300" required /></div>
                <div><label htmlFor="expense-amount" className="block text-sm font-medium text-gray-600">Amount (₹)</label><input type="number" id="expense-amount" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g., 15000" className="mt-1 block w-full bg-gray-50 rounded-md py-2 px-3 border-gray-300" required min="0" /></div>
                <div><label htmlFor="expense-proof" className="block text-sm font-medium text-gray-600">Supporting Document (Optional)</label><input type="file" id="expense-proof" onChange={e => setProof(e.target.files[0])} accept="image/*,application/pdf" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" /></div>
                <button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50">{loading ? <Loader size="sm" text="" /> : 'Submit for Approval'}</button>
            </form>
        </div>
    );
};

export default function ExpensesTab() {
    const { expenses, refetchData } = useFirmData();
    const { currentUser } = useAuth();

    const myExpenses = useMemo(() => {
        if (!expenses || !currentUser) return [];
        return expenses
            .filter(exp => exp.submitted_by_uid === currentUser.id)
            .sort((a, b) => new Date(b.submission_date) - new Date(a.submission_date));
    }, [expenses, currentUser]);

    return (
        <main className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <ExpenseForm onSuccess={refetchData} />
            <div className="xl:col-span-2 bg-white p-6 rounded-lg shadow">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">My Expense History</h2>
                <div className="space-y-4 max-h-[70vh] overflow-y-auto light-scrollbar">
                    {myExpenses.length > 0 ? (
                        myExpenses.map(exp => {
                            const proofUrl = getFileUrl(exp, 'proof');
                            return (
                                <div key={exp.id} className="bg-gray-50 p-3 rounded-lg border">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-gray-800">{exp.description}</p>
                                            <p className="text-sm text-gray-500">{formatDate(exp.submission_date)}</p>
                                            <div className="mt-2"><StatusBadge status={exp.status} /></div>
                                        </div>
                                        <p className="font-bold text-red-600 text-lg">{inrFormatter.format(exp.amount)}</p>
                                    </div>
                                    {proofUrl && (
                                        <div className="mt-2 border-t pt-2"><a href={proofUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">View Proof</a></div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-gray-500 p-4 text-center">You have not submitted any expenses yet.</p>
                    )}
                </div>
            </div>
        </main>
    );
}