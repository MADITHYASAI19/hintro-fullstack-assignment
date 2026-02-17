import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import api from '../utils/api';

const Task = ({ task, index, members = [] }) => {
    const [showAssign, setShowAssign] = React.useState(false);

    const toggleUser = async (memberId) => {
        try {
            const current = task.assignedTo || [];
            const isAssigned = current.some(u => u._id === memberId);
            const newAssigned = isAssigned
                ? current.filter(u => u._id !== memberId).map(u => u._id)
                : [...current.map(u => u._id), memberId];
            await api.put(`/tasks/${task._id}`, { assignedTo: newAssigned, boardId: task.board });
        } catch (err) {
            console.error(err);
        }
    };

    const deleteTask = async () => {
        if (!window.confirm('Delete this task?')) return;
        try {
            await api.delete(`/tasks/${task._id}`);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <Draggable draggableId={task._id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`p-3 mb-2 rounded border group relative ${snapshot.isDragging
                        ? 'bg-gray-50 border-gray-400 shadow-md'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                        } ${task._optimistic ? 'opacity-50' : ''}`}
                >
                    <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-black">{task.title}</div>
                            {task.description && (
                                <div className="text-xs text-gray-400 mt-1 truncate">{task.description}</div>
                            )}
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 ml-2">
                            <button
                                onClick={() => setShowAssign(!showAssign)}
                                className="text-gray-400 hover:text-black p-1 rounded hover:bg-gray-100 text-xs"
                                title="Assign Members"
                            >
                                👤
                            </button>
                            <button
                                onClick={deleteTask}
                                className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-gray-100 text-xs"
                                title="Delete Task"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {showAssign && (
                        <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-20 w-48 max-h-48 overflow-y-auto">
                            <div className="text-xs font-medium mb-2 text-gray-500 uppercase">Assign</div>
                            {members.map(member => (
                                <div
                                    key={member._id}
                                    onClick={() => toggleUser(member._id)}
                                    className="flex items-center gap-2 p-1.5 hover:bg-gray-50 cursor-pointer rounded"
                                >
                                    <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold">
                                        {member.username ? member.username.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <span className="text-xs text-gray-700 truncate font-medium">{member.username}</span>
                                    {task.assignedTo && task.assignedTo.some(u => u._id === member._id) && (
                                        <span className="text-green-600 text-xs ml-auto">✓</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {task.assignedTo && task.assignedTo.length > 0 && (
                        <div className="flex -space-x-1 overflow-hidden mt-2 pt-2 border-t border-gray-100">
                            {task.assignedTo.map((user, i) => (
                                <div
                                    key={i}
                                    className="inline-flex h-5 w-5 rounded-full ring-1 ring-white bg-gray-200 items-center justify-center text-[9px] text-gray-600 font-bold"
                                    title={user.username || user.name}
                                >
                                    {(user.username || user.name || 'U').charAt(0).toUpperCase()}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Draggable>
    );
};

export default Task;
