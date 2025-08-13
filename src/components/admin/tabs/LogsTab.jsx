import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { pb, logErrorToPocketBase, formatDate } from '../../../services/pocketbase';
import Loader from '../../common/Loader';

const ActivityLogItem = ({ log }) => (
    <div className="bg-gray-700 p-2.5 rounded-md text-sm">
        <p className="font-semibold text-gray-200">{log.description}</p>
        <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
            <span>By: {log.actor_email || 'System'}</span>
            <span>{formatDate(log.created)}</span>
        </div>
    </div>
);

const ErrorLogItem = ({ log }) => (
    <div className="bg-gray-900 p-2.5 rounded-md text-xs font-mono border border-red-900/50">
        <p className="font-semibold text-red-300 break-all">{log.message}</p>
        <p className="text-gray-400 mt-1">User: {log.user_email}</p>
        <p className="text-gray-500 mt-1 break-all">Source: {log.source}:{log.lineno}</p>
        <p className="text-gray-500 mt-1">{formatDate(log.created)}</p>
    </div>
);

const LogPanel = ({ title, description, isLoading, logs, LogItemComponent, error, titleColorClass = 'text-white' }) => (
    <div>
        <h2 className={`text-2xl font-semibold mb-1 ${titleColorClass}`}>{title}</h2>
        <p className="text-sm text-gray-400 mb-4">{description}</p>
        <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
            {isLoading && <Loader text="Loading Logs..." />}
            {error && <p className="text-red-400 p-4 bg-red-900/20 rounded-md">{error}</p>}
            {!isLoading && !error && logs.length === 0 && <p className="text-gray-500 p-4">No logs found.</p>}
            {!isLoading && !error && logs.map(log => <LogItemComponent key={log.id} log={log} />)}
        </div>
    </div>
);

export default function LogsTab() {
    const { currentUser } = useAuth();
    const [activityLogs, setActivityLogs] = useState([]);
    const [errorLogs, setErrorLogs] = useState([]);
    const [loading, setLoading] = useState({ activity: true, error: true });
    const [error, setError] = useState({ activity: null, error: null });

    const isSuperAdmin = currentUser?.role === 'super-admin';

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const fetchLogs = async () => {
            try {
                const activityData = await pb.collection('activity_logs').getFullList({
                    perPage: 100,
                    fields: '*',
                    signal,
                });
                setActivityLogs(activityData);
            } catch (err) {
                if (!err.isAbort) {
                    setError(prev => ({ ...prev, activity: "Could not load activity log." }));
                    console.error("Activity Log Fetch Error:", err);
                }
            } finally {
                setLoading(prev => ({ ...prev, activity: false }));
            }
            if (isSuperAdmin) {
                try {
                    const errorData = await pb.collection('error_logs').getFullList({
                        perPage: 100,
                        fields: '*',
                        signal,
                    });
                    setErrorLogs(errorData);
                } catch (err) {
                    if (!err.isAbort) {
                        setError(prev => ({ ...prev, error: "Could not load error log." }));
                        console.error("Error Log Fetch Error:", err);
                    }
                } finally {
                    setLoading(prev => ({ ...prev, error: false }));
                }
            } else {
                setLoading(prev => ({ ...prev, error: false }));
            }
        };
        
        fetchLogs();

        return () => {
            controller.abort();
        };

    }, [isSuperAdmin]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <LogPanel
                title="Activity Log"
                description="Shows recent important actions across the system."
                isLoading={loading.activity}
                logs={activityLogs.sort((a,b) => new Date(b.created) - new Date(a.created))}
                LogItemComponent={ActivityLogItem}
                error={error.activity}
            />
            {isSuperAdmin && (
                <LogPanel
                    title="Error Log"
                    description="Automatically captured application errors for diagnosis."
                    isLoading={loading.error}
                    logs={errorLogs.sort((a,b) => new Date(b.created) - new Date(a.created))}
                    LogItemComponent={ErrorLogItem}
                    error={error.error}
                    titleColorClass="text-red-400"
                />
            )}
        </div>
    );
}