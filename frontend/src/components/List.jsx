import React, { useState } from 'react';
import { Droppable } from 'react-beautiful-dnd';
import Task from './Task';
import api from '../utils/api';

const List = ({ list, boardId, members = [] }) => {
    const [newTaskTitle, setNewTaskTitle] = useState('');

    const addTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        const tempTitle = newTaskTitle;
        setNewTaskTitle('');
        try {
            await api.post('/tasks', {
                title: tempTitle,
                listId: list._id,
                boardId,
                position: list.tasks.length
            });
        } catch (err) {
            console.error(err);
            setNewTaskTitle(tempTitle);
        }
    };

    return (
        <div className="w-72 shrink-0 bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-full flex flex-col">
            <div className="flex justify-between items-center mb-3 px-1">
                <h3 className="font-semibold text-sm text-black">{list.title}</h3>
                <span className="text-gray-400 text-xs bg-gray-100 px-2 py-0.5 rounded">
                    {list.tasks ? list.tasks.length : 0}
                </span>
            </div>

            <Droppable droppableId={list._id} type="task">
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-grow overflow-y-auto pr-1 min-h-[40px] rounded ${snapshot.isDraggingOver ? 'bg-gray-100' : ''}`}
                    >
                        {list.tasks && list.tasks.map((task, index) => (
                            <Task key={task._id} task={task} index={index} members={members} />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>

            <form onSubmit={addTask} className="mt-2">
                <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="+ Add a card"
                    className="w-full p-2 text-sm rounded border border-gray-200 bg-white placeholder-gray-400 focus:outline-none focus:border-black"
                />
            </form>
        </div>
    );
};

export default List;
