import React, { useState, useEffect } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import Modal from '../common/Modal'; 
import { pb, logErrorToPocketBase } from '../../services/pocketbase';

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {function} props.onSuccess
 * @param {object | null} props.firm
 */
export default function DeleteFirmModal({ isOpen, onClose, onSuccess, firm }) {
    const [confirmationInput, setConfirmationInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    useEffect(() => {
        if (isOpen) {
            setConfirmationInput('');
            setError('');
            setLoading(false);
        }
    }, [isOpen, firm]);
    const isConfirmationMatch = confirmationInput === firm?.name;
    const handleDelete = async (e) => {
        e.preventDefault();
        if (!isConfirmationMatch) {
            setError("Confirmation name does not match. Deletion cancelled.");
            return;
        }
        setLoading(true);
        setError('');

        try {        
            const collectionsToDelete = ['items', 'sales', 'customers', 'expenses', 'deposits'];
            for (const coll of collectionsToDelete) {
                const records = await pb.collection(coll).getFullList({
                    filter: `firm_id="${firm.id}"`,
                    $autoCancel: false,
                    fields: 'id' 
                });
                for (const record of records) {
                    await pb.collection(coll).delete(record.id);
                }
            }
            await pb.collection('firms').delete(firm.id);

            alert(`Firm "${firm.name}" and all its data have been permanently deleted.`);
            onSuccess();

        } catch (err) {
            const errorMessage = "An error occurred during deletion. Some data may remain. Please check server logs.";
            setError(errorMessage);
            logErrorToPocketBase({
                message: `Firm deletion failed for ${firm?.name} (${firm?.id})`,
                stack: err.stack,
            });
            console.error("Firm deletion failed:", err);
        } finally {
            setLoading(false);
        }
    };
    if (!isOpen || !firm) {
        return null;
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleDelete}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                            <FaExclamationTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
                        </div>
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                Delete Firm Data
                            </h3>
                            <div className="mt-2 space-y-3">
                                <p className="text-sm text-gray-500">
                                    This action is irreversible and will permanently delete all data associated with the firm <strong className="text-red-700">{firm.name}</strong>, including all inventory, sales, customers, and expenses.
                                </p>
                                <p className="text-sm text-gray-500">
                                    To confirm, please type the firm's name below:
                                </p>
                                <input
                                    type="text"
                                    value={confirmationInput}
                                    onChange={(e) => setConfirmationInput(e.target.value)}
                                    className="w-full border-gray-300 rounded-md shadow-sm"
                                    aria-label="Firm name confirmation"
                                    disabled={loading}
                                />
                                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                        type="submit"
                        disabled={!isConfirmationMatch || loading}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Deleting...' : 'Delete Permanently'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </Modal>
    );
}