import React, {useState, useMemo } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { pb, inrFormatter, getFileUrl, formatDate, logErrorToPocketBase } from '../../../services/pocketbase';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

/**
 * @param {object} props
 * @param {Array<object>} [props.approvals=[]]
 */
const ApprovalTrail = ({ approvals = [] }) => {
    if (approvals.length === 0) {
        return <p className="text-xs text-gray-500 italic">No votes yet.</p>;
    }
    return (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
            {approvals.map(vote => (
                <div key={vote.admin_id} className="flex items-center gap-1 text-xs">
                    {vote.vote === 'approved' ? <FaCheckCircle className="text-green-400" /> : <FaTimesCircle className="text-red-400" />}
                    <span className="text-gray-400">{vote.admin_email}</span>
                </div>
            ))}
        </div>
    );
};


/**
 * @param {object} props
 * @param {object} props.expense
 * @param {function} props.onVote
 * @param {boolean} props.isProcessing
 * @param {object} props.currentUser
 */
const PendingExpenseItem = ({ expense, onVote, isProcessing, currentUser }) => {
    const proofUrl = getFileUrl(expense, 'proof');
    const submissionDate = formatDate(expense.submission_date);
    const approvals = expense.approvals || [];
    const hasVoted = approvals.some(vote => vote.admin_id === currentUser.id);
    const canVote = currentUser?.role === 'admin' && !hasVoted;

    return (
        <div className="bg-gray-700 p-4 rounded-lg space-y-3 transition-opacity duration-300 ease-in-out">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                {/* */}
                <div>
                    <p className="font-semibold text-white text-lg">{expense.description}</p>
                    <p className="text-xl font-bold text-red-400">{inrFormatter.format(expense.amount)}</p>
                    <p className="text-xs text-gray-400 mt-1">
                        Submitted by: {expense.submitted_by_email || 'system'} on {submissionDate}
                    </p>
                </div>
                {/* */}
                {canVote && (
                    <div className="flex gap-2 flex-shrink-0 justify-end w-full sm:w-auto">
                        <button onClick={() => onVote(expense, 'approved')} disabled={isProcessing} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed">Approve</button>
                        <button onClick={() => onVote(expense, 'rejected')} disabled={isProcessing} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed">Reject</button>
                    </div>
                )}
            </div>
            
            {/* */}
            <div className="border-t border-gray-600 pt-3 space-y-3">
                {proofUrl && (
                    <div>
                        <a href={proofUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium hover:underline">
                            View Supporting Document
                        </a>
                    </div>
                )}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Approval Status</h4>
                    <ApprovalTrail approvals={approvals} />
                </div>
            </div>
        </div>
    );
};


/**
 * @param {object} props
 * @param {Array<object>} props.expenses
 * @param {function} props.onUpdate
 * @param {number} props.totalAdmins
 */
export default function ApproveExpensesTab({ expenses, onUpdate, totalAdmins }) {
    const { currentUser } = useAuth();
    const [processingId, setProcessingId] = useState(null);

    const pendingExpenses = useMemo(() => {
        if (!expenses) return [];
        return expenses.filter(e => e.status === 'pending');
    }, [expenses]);

    const handleVote = async (expense, voteType) => {
        if (!currentUser) {
            alert("Authentication error. Please log in again.");
            return;
        }

        setProcessingId(expense.id);
        const currentApprovals = expense.approvals || [];

        if (currentApprovals.some(v => v.admin_id === currentUser.id)) {
            alert("You have already voted on this expense.");
            setProcessingId(null);
            return;
        }

        const newVote = {
            admin_id: currentUser.id,
            admin_email: currentUser.email,
            vote: voteType,
            timestamp: new Date().toISOString(),
        };

        const updatedApprovals = [...currentApprovals, newVote];
        let finalStatus = 'pending';
        if (voteType === 'rejected') {
            finalStatus = 'rejected';
        } else {
            const approvalCount = updatedApprovals.filter(v => v.vote === 'approved').length;
            if (totalAdmins > 0 && approvalCount >= totalAdmins) {
                finalStatus = 'approved';
            }
        }

        try {
            await pb.collection('expenses').update(expense.id, {
                approvals: updatedApprovals,
                status: finalStatus,
            });
            onUpdate();
        } catch (error) {
            logErrorToPocketBase({ message: `Failed to vote on expense ${expense.id}`, stack: error.stack, source: 'ApproveExpensesTab.jsx' });
            alert(`Action failed: ${error.message}`);
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-2 text-gray-200">Pending Expense Approvals</h2>
            <p className="text-sm text-gray-400 mb-4">
                An expense is approved only when all {totalAdmins > 0 ? totalAdmins : 1} admin(s) approve it. A single rejection will reject the entire request.
            </p>
            <div className="space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar pr-2">
                {pendingExpenses.length > 0 ? (
                    pendingExpenses.map(exp => (
                        <PendingExpenseItem
                            key={exp.id}
                            expense={exp}
                            onVote={handleVote}
                            isProcessing={processingId === exp.id}
                            currentUser={currentUser}
                        />
                    ))
                ) : (
                    <div className="flex items-center justify-center h-48 bg-gray-700 rounded-lg">
                        <p className="text-gray-400">No expenses are currently pending approval.</p>
                    </div>
                )}
            </div>
        </div>
    );
}