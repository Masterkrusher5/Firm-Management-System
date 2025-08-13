import React from 'react';

/**
 * 
 * @param {object} props
 * @param {boolean} props.isOpen 
 * @param {function} props.onClose 
 * @param {React.ReactNode} props.children 
 */
export default function Modal({ isOpen, onClose, children }) {
    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed z-20 inset-0 overflow-y-auto" 
            aria-labelledby="modal-title" 
            role="dialog"                 
            aria-modal="true"             
        >
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div 
                    className="fixed inset-0 bg-gray-800 bg-opacity-75 transition-opacity" 
                    aria-hidden="true"
                    onClick={onClose}
                ></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div 
                    className="inline-block align-bottom transform transition-all sm:align-middle"
                    onClick={(e) => e.stopPropagation()}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}