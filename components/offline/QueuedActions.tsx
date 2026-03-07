'use client';

import React, { useState } from 'react';
import { useOffline, QueuedAction } from './OfflineProvider';
import { RefreshCw, Trash2, Clock, History } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QueuedActions() {
    const { queuedActions, removeAction, clearQueue, isOnline } = useOffline();
    const [retrying, setRetrying] = useState<string | null>(null);

    const handleRetry = async (action: QueuedAction) => {
        if (!isOnline) {
            alert('You must be online to retry this action.');
            return;
        }

        setRetrying(action.id);
        // Simulate re-submitting to API
        console.log('Retrying action:', action);
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // In a real app, logic would call the API here
        removeAction(action.id);
        setRetrying(null);
    };

    const handleRetryAll = async () => {
        if (!isOnline) {
            alert('You must be online to retry all actions.');
            return;
        }

        for (const action of queuedActions) {
            setRetrying(action.id);
            await new Promise((resolve) => setTimeout(resolve, 800));
            removeAction(action.id);
        }
        setRetrying(null);
    };

    if (queuedActions.length === 0) return null;

    return (
        <div className="fixed bottom-6 right-6 z-40 w-80 max-h-[400px] flex flex-col bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <History className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-bold text-gray-900 dark:text-white">Queued Actions</h3>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {queuedActions.length}
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                <AnimatePresence>
                    {queuedActions.map((action) => (
                        <motion.div
                            key={action.id}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 group hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{action.description}</p>
                                    <div className="flex items-center space-x-2 text-[10px] text-gray-500 dark:text-gray-400">
                                        <Clock className="w-3 h-3" />
                                        <span>{new Date(action.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                </div>
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => handleRetry(action)}
                                        disabled={retrying === action.id || !isOnline}
                                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                        title="Retry"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${retrying === action.id ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button
                                        onClick={() => removeAction(action.id)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                        title="Remove"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-t dark:border-gray-600 grid grid-cols-2 gap-3">
                <button
                    onClick={clearQueue}
                    className="px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                    Clear All
                </button>
                <button
                    onClick={handleRetryAll}
                    disabled={!isOnline || queuedActions.length === 0}
                    className="px-3 py-2 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:opacity-50 rounded-lg flex items-center justify-center space-x-2 transition-all shadow-sm"
                >
                    <RefreshCw className="w-3 h-3" />
                    <span>Retry All</span>
                </button>
            </div>
        </div>
    );
}
