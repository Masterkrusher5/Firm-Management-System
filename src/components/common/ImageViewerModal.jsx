import React from 'react';

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {React.ReactNode} props.children
 */
const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed z-30 inset-0 overflow-y-auto" 
            aria-labelledby="modal-title" 
            role="dialog" 
            aria-modal="true"
        >
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div 
                    className="fixed inset-0 bg-gray-900 bg-opacity-80 transition-opacity" 
                    aria-hidden="true"
                    onClick={onClose}
                ></div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                {children}
            </div>
        </div>
    );
};


/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {function} props.onClose
 * @param {string[]} props.imageUrls
 * @param {string} props.title
 */
export default function ImageViewerModal({ isOpen, onClose, imageUrls, title }) {
    
    const hasImages = imageUrls && imageUrls.length > 0;

    return (
        
        <Modal isOpen={isOpen} onClose={onClose}>
            <div 
                className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="bg-gray-800 px-6 py-4 flex justify-between items-center">
                    <h3 className="text-xl font-semibold text-white" id="modal-title">
                        {title}
                    </h3>
                    <button 
                        type="button" 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-white text-3xl leading-none font-bold"
                        aria-label="Close image viewer"
                    >
                        &times;
                    </button>
                </div>
                <div 
                    className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto light-scrollbar"
                >
                    {hasImages ? (
                        imageUrls.map((url, index) => (
                            <div key={index} className="bg-gray-200 rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                                <a href={url} target="_blank" rel="noopener noreferrer" title="View full image in new tab">
                                    <img 
                                        src={url} 
                                        alt={`Proof ${index + 1}`}
                                        className="w-full h-auto object-contain cursor-pointer"
                                        
                                        style={{ minHeight: '150px' }}
                                        loading="lazy" 
                                    />
                                </a>
                            </div>
                        ))
                    ) : (
                        
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <p>No images to display.</p>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}