import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';

const timeAgo = (dateString) => {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateString).toLocaleDateString();
};

const describeActivity = (activity) => {
    const { actionType, entityType, metadata } = activity;
    const name = metadata?.taskTitle || metadata?.listTitle || metadata?.boardTitle || entityType;
    switch (actionType) {
        case 'created': return `created ${entityType} "${name}"`;
        case 'updated': return `updated ${entityType} "${name}"`;
        case 'deleted': return `deleted ${entityType} "${name}"`;
        case 'moved': return `moved "${name}" from "${metadata?.fromList}" to "${metadata?.toList}"`;
        case 'assigned': return `updated assignment on "${name}"`;
        default: return `${actionType} on ${entityType}`;
    }
};

const ActivitySidebar = ({ boardId, socket, isOpen, onClose }) => {
    const [activities, setActivities] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(false);
    const [totalItems, setTotalItems] = useState(0);
    const PER_PAGE = 20;

    const fetchActivities = useCallback(async (page = 1, append = false) => {
        setLoading(true);
        try {
            const res = await api.get(`/boards/${boardId}/activity?page=${page}&limit=${PER_PAGE}`);
            if (append) {
                setActivities(prev => [...prev, ...res.data.data]);
            } else {
                setActivities(res.data.data);
            }
            setTotalPages(res.data.totalPages);
            setCurrentPage(res.data.currentPage);
            setTotalItems(res.data.totalItems);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [boardId]);

    useEffect(() => {
        if (isOpen && boardId) fetchActivities(1);
    }, [isOpen, boardId, fetchActivities]);

    useEffect(() => {
        if (!socket || !isOpen) return;
        const onNewActivity = (activity) => {
            setActivities(prev => [activity, ...prev]);
            setTotalItems(prev => prev + 1);
        };
        socket.on('activity_created', onNewActivity);
        return () => socket.off('activity_created', onNewActivity);
    }, [socket, isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed right-0 top-0 h-full w-96 z-50 flex flex-col bg-white border-l border-gray-200 shadow-lg">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold text-black">Activity</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{totalItems} events</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-400 hover:text-black text-sm">
                    ✕
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {activities.length === 0 && !loading ? (
                    <div className="text-center py-16">
                        <p className="text-gray-400 text-sm">No activity yet</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {activities.map((activity, index) => (
                            <div key={activity._id || index} className="py-2 px-3 rounded hover:bg-gray-50">
                                <p className="text-sm text-gray-600">
                                    <span className="font-medium text-black">{activity.user?.username || 'Unknown'}</span>
                                    {' '}{describeActivity(activity)}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">{timeAgo(activity.timestamp)}</p>
                            </div>
                        ))}
                    </div>
                )}

                {currentPage < totalPages && (
                    <div className="text-center mt-4">
                        <button
                            onClick={() => fetchActivities(currentPage + 1, true)}
                            disabled={loading}
                            className="px-4 py-2 text-sm text-gray-500 hover:text-black font-medium disabled:opacity-50 border border-gray-200 rounded hover:border-gray-400"
                        >
                            {loading ? 'Loading...' : 'Load more'}
                        </button>
                    </div>
                )}

                {loading && activities.length === 0 && (
                    <div className="text-center py-16">
                        <p className="text-gray-400 text-sm">Loading...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActivitySidebar;
