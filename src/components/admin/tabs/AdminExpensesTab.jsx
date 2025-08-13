import React from 'react';
import { inrFormatter, getFileUrl, formatDate } from '../../../services/pocketbase';

/**
 *
 * @param {object} props
 * @param {'approved' | 'pending' | 'rejected'} props.status
 */
const StatusBadge = ({ status }) => {
    const statusStyles = {
        approved: {
            text: 'Approved',
            className: 'bg-green-500/20 text-green-400',
        },
        pending: {
            text: 'Pending',
            className: 'bg-yellow-500/20 text-yellow-400',
        },
        rejected: {
            text: 'Rejected',
            className: 'bg-red-500/20 text-red-400',
        },
    };
    const style = statusStyles[status] || { text: 'Unknown', className: 'bg-gray-500/20 text-gray-300' };

    return (
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${style.className}`}>
            {style.text}
        </span>
    );
};

/**
 * 
 * @param {object} props
 * @param {object} props.expense
 */
const ExpenseHistoryItem = ({ expense }) => {
    const proofUrl = getFileUrl(expense, 'proof');
    
    const submissionDate = formatDate(expense.submission_date);

    return (
        <div className="bg-gray-700 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start gap-4">
            {/*  */}
            <div className="flex-grow">
                <p className="font-semibold text-white text-lg">{expense.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                    <StatusBadge status={expense.status} />
                    <span>Submitted by: {expense.submitted_by_email || 'system'}</span>
                </div>
                {/* */}
                <p className="text-xs text-gray-500 mt-2">{submissionDate}</p>
            </div>

            {/*  */}
            <div className="flex-shrink-0 text-left sm:text-right w-full sm:w-auto">
                <p className="font-bold text-xl text-red-400">{inrFormatter.format(expense.amount)}</p>
                {proofUrl && (
                    <div className="mt-2">
                        <a 
                            href={proofUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-indigo-400 hover:text-indigo-300 text-sm font-medium hover:underline"
                        >
                            View Document
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};


/**
 * 
 * @param {object} props
 * @param {Array<object>} props.expenses
 */
export default function AdminExpensesTab({ expenses }) {

    const sortedExpenses = React.useMemo(() => {
        if (!expenses) return [];
        return [...expenses].sort((a, b) => new Date(b.submission_date) - new Date(a.submission_date));
    }, [expenses]);

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-4 text-gray-200">Full Expense History</h2>
            <div className="space-y-4 max-h-[65vh] overflow-y-auto custom-scrollbar pr-2">
                {sortedExpenses.length > 0 ? (
                    sortedExpenses.map(exp => (
                        <ExpenseHistoryItem key={exp.id} expense={exp} />
                    ))
                ) : (
                    <div className="flex items-center justify-center h-48 bg-gray-700 rounded-lg">
                        <p className="text-gray-400">No expenses have been recorded for this firm.</p>
                    </div>
                )}
            </div>
        </div>
    );
}