import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useFirmData } from '../../../contexts/FirmDataContext';
import { pb, logErrorToPocketBase } from '../../../services/pocketbase';
import Loader from '../../common/Loader';

export default function FeedbackTab() {
    const { currentUser } = useAuth();
    const { firmId } = useFirmData();
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState({
        message: '',
        type: '', 
    });
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!message.trim()) {
            setStatus({ message: 'Please write some feedback before submitting.', type: 'error' });
            return;
        }
        setLoading(true);
        setStatus({ message: '', type: '' }); 

        const feedbackData = {
            message: message,
            firm_id: firmId,
            user_email: currentUser?.email || 'anonymous',
            user_agent: navigator.userAgent, 
        };

        try {
            await pb.collection('feedback').create(feedbackData);
            setMessage('');
            setStatus({ message: 'Thank you for your feedback!', type: 'success' });
        } catch (error) {
            logErrorToPocketBase({ message: "Feedback submission failed", stack: error.stack });
            setStatus({ message: 'Failed to submit feedback. Please try again.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };
    const statusColorClass = status.type === 'success' 
        ? 'text-green-600' 
        : 'text-red-600';
    return (
        <div className="bg-white p-6 rounded-lg shadow max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">System Feedback</h2>
            <p className="text-sm text-gray-600 mb-6">
                Encountered a bug or have a suggestion to improve the system? Please let us know!
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
                <textarea 
                    id="feedback-message"
                    rows="6"
                    className="w-full border border-gray-300 rounded-md p-3 text-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Write your feedback here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                ></textarea>
                
                <div className="flex items-center justify-between">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50"
                    >
                        {loading ? <Loader size="sm" text="" /> : 'Submit Feedback'}
                    </button>
                    {status.message && (
                        <p className={`font-medium text-sm ${statusColorClass}`}>
                            {status.message}
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}