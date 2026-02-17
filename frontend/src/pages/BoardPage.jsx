import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import io from 'socket.io-client';
import api from '../utils/api';
import List from '../components/List';
import ActivitySidebar from '../components/ActivitySidebar';

let socket;

const BoardPage = () => {
    const { id } = useParams();
    const [board, setBoard] = useState(null);
    const [lists, setLists] = useState([]);
    const [newListTitle, setNewListTitle] = useState('');

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchPage, setSearchPage] = useState(1);
    const [searchTotalPages, setSearchTotalPages] = useState(1);
    const searchTimer = useRef(null);

    const [showListView, setShowListView] = useState(false);
    const [paginatedTasks, setPaginatedTasks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const TASKS_PER_PAGE = 10;

    const [showActivity, setShowActivity] = useState(false);
    const previousListsRef = useRef([]);

    const fetchBoard = useCallback(async () => {
        try {
            const res = await api.get(`/boards/${id}`);
            setBoard(res.data);
            setLists(res.data.lists || []);
        } catch (err) {
            console.error(err);
        }
    }, [id]);

    useEffect(() => {
        socket = io('http://localhost:5000');
        socket.emit('join_board', id);
        fetchBoard();

        socket.on('list_created', (newList) => {
            setLists(prev => [...prev, { ...newList, tasks: [] }]);
        });

        socket.on('task_created', (newTask) => {
            setLists(prevLists => prevLists.map(list => {
                if (list._id === newTask.list) {
                    const exists = list.tasks.some(t => t._id === newTask._id);
                    if (exists) return { ...list, tasks: list.tasks.map(t => t._id === newTask._id ? newTask : t) };
                    const filtered = list.tasks.filter(t => !t._optimistic);
                    return { ...list, tasks: [...filtered, newTask] };
                }
                return list;
            }));
            if (showListView) fetchPaginatedTasks(currentPage);
        });

        socket.on('task_updated', (updatedTask) => {
            setLists(prevLists => {
                const cleaned = prevLists.map(list => ({
                    ...list,
                    tasks: list.tasks.filter(t => t._id !== updatedTask._id)
                }));
                return cleaned.map(list => {
                    if (list._id === updatedTask.list) {
                        return { ...list, tasks: [...list.tasks, updatedTask] };
                    }
                    return list;
                });
            });
            if (showListView) fetchPaginatedTasks(currentPage);
        });

        socket.on('task_deleted', (taskId) => {
            setLists(prevLists => prevLists.map(list => ({
                ...list,
                tasks: list.tasks.filter(t => t._id !== taskId)
            })));
            if (showListView) fetchPaginatedTasks(currentPage);
        });

        return () => { socket.disconnect(); };
    }, [id]);

    const onDragEnd = async (result) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const previousLists = lists.map(l => ({ ...l, tasks: [...l.tasks] }));
        previousListsRef.current = previousLists;

        const newLists = lists.map(l => ({ ...l, tasks: [...l.tasks] }));
        const sourceIdx = newLists.findIndex(l => l._id === source.droppableId);
        const destIdx = newLists.findIndex(l => l._id === destination.droppableId);
        if (sourceIdx === -1 || destIdx === -1) return;

        const [movedTask] = newLists[sourceIdx].tasks.splice(source.index, 1);
        newLists[destIdx].tasks.splice(destination.index, 0, movedTask);
        setLists(newLists);

        try {
            await api.put(`/tasks/${draggableId}`, {
                listId: newLists[destIdx]._id,
                position: destination.index,
                boardId: id
            });
        } catch (err) {
            console.error(err);
            setLists(previousListsRef.current);
        }
    };

    const createList = async (e) => {
        e.preventDefault();
        if (!newListTitle) return;
        try {
            await api.post('/lists', { title: newListTitle, boardId: id, position: lists.length });
            setNewListTitle('');
        } catch (err) {
            console.error(err);
        }
    };

    const performSearch = useCallback(async (query, page = 1) => {
        if (query.trim().length === 0) { setIsSearching(false); setSearchResults([]); return; }
        try {
            const res = await api.get(`/tasks/search?q=${encodeURIComponent(query)}&boardId=${id}&page=${page}&limit=10`);
            setSearchResults(res.data.data);
            setSearchTotalPages(res.data.totalPages);
            setSearchPage(res.data.currentPage);
            setIsSearching(true);
        } catch (err) {
            console.error(err);
        }
    }, [id]);

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (searchTimer.current) clearTimeout(searchTimer.current);
        if (query.trim().length === 0) { setIsSearching(false); setSearchResults([]); return; }
        searchTimer.current = setTimeout(() => performSearch(query, 1), 300);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setIsSearching(false);
        setSearchResults([]);
    };

    const fetchPaginatedTasks = async (page) => {
        setLoadingTasks(true);
        try {
            const res = await api.get(`/boards/${id}/tasks?page=${page}&limit=${TASKS_PER_PAGE}`);
            setPaginatedTasks(res.data.data);
            setTotalPages(res.data.totalPages);
            setCurrentPage(res.data.currentPage);
            setTotalItems(res.data.totalItems);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingTasks(false);
        }
    };

    const toggleListView = () => {
        setShowListView(!showListView);
        if (!showListView) fetchPaginatedTasks(1);
    };

    const getPageNumbers = () => {
        const pages = [];
        const max = 5;
        let start = Math.max(1, currentPage - Math.floor(max / 2));
        let end = Math.min(totalPages, start + max - 1);
        if (end - start < max - 1) start = Math.max(1, end - max + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    if (!board) return (
        <div className="flex items-center justify-center h-[calc(100vh-60px)]">
            <p className="text-gray-400 text-sm">Loading board...</p>
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-52px)] overflow-hidden">
            {/* Board header */}
            <div className="border-b border-gray-200 px-6 py-3 flex justify-between items-center bg-white">
                <div className="flex items-center gap-4">
                    <Link to="/dashboard" className="text-gray-400 hover:text-black text-sm">← Boards</Link>
                    <div className="w-px h-5 bg-gray-200"></div>
                    <h1 className="text-lg font-bold text-black">{board.title}</h1>
                </div>

                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={handleSearch}
                            className="pl-8 pr-8 py-2 rounded border border-gray-200 text-sm w-56 focus:outline-none focus:border-black"
                        />
                        <span className="absolute left-2.5 top-2.5 text-gray-400 text-sm">🔍</span>
                        {searchQuery && (
                            <button onClick={clearSearch} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-black text-sm">✕</button>
                        )}

                        {isSearching && (
                            <div className="absolute top-full mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 max-h-96 overflow-y-auto">
                                <h3 className="text-xs font-medium text-gray-400 uppercase px-2 mb-2">Results</h3>
                                {searchResults.length === 0 ? (
                                    <div className="p-4 text-sm text-gray-400 text-center">No tasks found</div>
                                ) : (
                                    <>
                                        {searchResults.map(task => (
                                            <div key={task._id} className="p-2 hover:bg-gray-50 rounded cursor-pointer">
                                                <div className="font-medium text-black text-sm">{task.title}</div>
                                                {task.description && <div className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</div>}
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {lists.find(l => l._id === task.list)?.title || ''}
                                                </div>
                                            </div>
                                        ))}
                                        {searchTotalPages > 1 && (
                                            <div className="flex justify-between items-center px-2 pt-2 border-t border-gray-100 mt-1">
                                                <span className="text-xs text-gray-400">{searchPage}/{searchTotalPages}</span>
                                                <div className="flex gap-2">
                                                    {searchPage > 1 && <button onClick={() => performSearch(searchQuery, searchPage - 1)} className="text-xs text-black">← Prev</button>}
                                                    {searchPage < searchTotalPages && <button onClick={() => performSearch(searchQuery, searchPage + 1)} className="text-xs text-black">Next →</button>}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <button onClick={toggleListView} className="px-3 py-2 rounded border border-gray-200 text-gray-500 hover:text-black hover:border-gray-400 text-sm">
                        {showListView ? '⊞ Board' : '☰ List'}
                    </button>

                    <button
                        onClick={() => setShowActivity(!showActivity)}
                        className={`px-3 py-2 rounded text-sm ${showActivity
                            ? 'bg-black text-white'
                            : 'border border-gray-200 text-gray-500 hover:text-black hover:border-gray-400'
                            }`}
                    >
                        Activity
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 bg-gray-50">
                {showListView ? (
                    <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-5xl mx-auto h-full overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-black">All Tasks</h2>
                            <span className="text-sm text-gray-400">{totalItems} tasks</span>
                        </div>

                        {loadingTasks ? (
                            <div className="text-center py-12">
                                <p className="text-gray-400 text-sm">Loading...</p>
                            </div>
                        ) : (
                            <>
                                <div className="divide-y divide-gray-100">
                                    {paginatedTasks.map(task => (
                                        <div key={task._id} className="py-3 px-4 flex justify-between items-center hover:bg-gray-50">
                                            <div>
                                                <span className="text-sm font-medium text-black">{task.title}</span>
                                                {task.description && <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>}
                                                {task.list && <span className="text-xs text-gray-500 mt-0.5 inline-block">{task.list.title || ''}</span>}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {task.assignedTo && task.assignedTo.length > 0 && (
                                                    <div className="flex -space-x-1">
                                                        {task.assignedTo.map((u, i) => (
                                                            <div key={i} className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-600 font-bold ring-1 ring-white" title={u.username}>
                                                                {(u.username || 'U')[0].toUpperCase()}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <span className="text-xs text-gray-400">{new Date(task.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                                    <span className="text-sm text-gray-400">Page {currentPage} of {totalPages}</span>
                                    <div className="flex gap-1">
                                        <button disabled={currentPage === 1} onClick={() => fetchPaginatedTasks(currentPage - 1)} className="px-3 py-1 rounded border border-gray-200 text-gray-500 hover:border-gray-400 disabled:opacity-30 text-sm">←</button>
                                        {getPageNumbers().map(page => (
                                            <button key={page} onClick={() => fetchPaginatedTasks(page)} className={`px-3 py-1 rounded text-sm ${page === currentPage ? 'bg-black text-white' : 'border border-gray-200 text-gray-500 hover:border-gray-400'}`}>{page}</button>
                                        ))}
                                        <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => fetchPaginatedTasks(currentPage + 1)} className="px-3 py-1 rounded border border-gray-200 text-gray-500 hover:border-gray-400 disabled:opacity-30 text-sm">→</button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                ) : (
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="flex h-full items-start gap-4">
                            {lists.map((list) => (
                                <List key={list._id} list={list} boardId={id} members={[board.user, ...(board.members || [])]} />
                            ))}
                            <div className="w-72 shrink-0 bg-gray-50 border border-dashed border-gray-300 p-3 rounded-lg">
                                <form onSubmit={createList}>
                                    <input
                                        type="text"
                                        value={newListTitle}
                                        onChange={(e) => setNewListTitle(e.target.value)}
                                        placeholder="+ Add another list"
                                        className="w-full p-2 bg-transparent placeholder-gray-400 text-black font-medium focus:outline-none text-sm"
                                    />
                                </form>
                            </div>
                        </div>
                    </DragDropContext>
                )}
            </div>

            <ActivitySidebar boardId={id} socket={socket} isOpen={showActivity} onClose={() => setShowActivity(false)} />
        </div>
    );
};

export default BoardPage;
