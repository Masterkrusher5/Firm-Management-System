import React from 'react';

/**
 * @param {object} props
 * @param {string} [props.text='Please wait...']
 * @param {boolean} [props.fullScreen=false]
 * @param {string} [props.size='md']
 */
export default function Loader({ text = 'Please wait...', fullScreen = false, size = 'md' }) {

    const sizeClasses = {
        sm: 'w-6 h-6 border-2', 
        md: 'w-12 h-12 border-4', 
        lg: 'w-16 h-16 border-4', 
    };

    const LoaderContent = (
        <div className={`flex flex-col items-center justify-center ${fullScreen ? 'text-gray-300' : 'text-gray-600'}`}>
            <div 
                className={`
                    animate-spin 
                    rounded-full 
                    border-solid 
                    border-indigo-500 
                    border-t-transparent 
                    ${sizeClasses[size] || sizeClasses['md']}
                `}
                role="status"
                aria-label="Loading"
            >
                <span className="sr-only">Connecting To Server...</span>
            </div>
            {text && (
                <p className="mt-4 text-lg">
                    {text}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div 
                className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-900 bg-opacity-80 backdrop-blur-sm"
                aria-label={text}
                role="alert"
                aria-live="assertive"
            >
                {LoaderContent}
            </div>
        );
    }
    
    return (
        <div className="inline-block" role="status">
            {LoaderContent}
        </div>
    );
}