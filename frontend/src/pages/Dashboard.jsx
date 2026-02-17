import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';

const Dashboard = () => {
    const [boards, setBoards] = useState([]);
    const [newBoardTitle, setNewBoardTitle] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const BOARDS_PER_PAGE = 9;

    const fetchBoards = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const res = await api.get(`/boards?page=${page}&limit=${BOARDS_PER_PAGE}`);
            setBoards(res.data.data);
            setTotalPages(res.data.totalPages);
            setCurrentPage(res.data.currentPage);
            setTotalItems(res.data.totalItems);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchBoards(1); }, [fetchBoards]);

    const createBoard = async (e) => {
        e.preventDefault();
        if (!newBoardTitle) return;
        try {
            await api.post('/boards', { title: newBoardTitle });
            setNewBoardTitle('');
            setShowCreate(false);
            fetchBoards(1);
        } catch (err) {
            console.error(err);
        }
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

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-black">Boards</h1>
                    <p className="text-gray-400 text-sm mt-1">{totalItems} board{totalItems !== 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className="px-4 py-2 rounded bg-black text-white text-sm font-medium hover:bg-gray-800"
                >
                    + New Board
                </button>
            </div>

            {showCreate && (
                <div className="border border-gray-200 rounded-lg p-4 mb-6">
                    <form onSubmit={createBoard} className="flex gap-3">
                        <input
                            type="text"
                            value={newBoardTitle}
                            onChange={(e) => setNewBoardTitle(e.target.value)}
                            placeholder="Board title..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-black"
                            autoFocus
                        />
                        <button type="submit" className="px-4 py-2 rounded bg-black text-white text-sm font-medium hover:bg-gray-800">
                            Create
                        </button>
                        <button
                            type="button"
                            onClick={() => { setShowCreate(false); setNewBoardTitle(''); }}
                            className="px-4 py-2 rounded text-gray-500 border border-gray-200 hover:border-gray-400 text-sm"
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="text-center py-20">
                    <p className="text-gray-400 text-sm">Loading boards...</p>
                </div>
            ) : boards.length === 0 ? (
                <div className="text-center py-20">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">No boards yet</h3>
                    <p className="text-gray-400 mb-4 text-sm">Create your first board to get started</p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="px-4 py-2 rounded bg-black text-white text-sm font-medium hover:bg-gray-800"
                    >
                        + Create Board
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {boards.map((board) => (
                            <Link to={`/board/${board._id}`} key={board._id} className="block group">
                                <div className="border border-gray-200 rounded-lg p-5 hover:bg-gray-50 transition-colors">
                                    <h2 className="text-base font-semibold text-black group-hover:underline mb-2">
                                        {board.title}
                                    </h2>
                                    <span className="text-gray-400 text-xs">
                                        {new Date(board.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center mt-8 gap-1">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => fetchBoards(currentPage - 1)}
                                className="px-3 py-1 rounded border border-gray-200 text-gray-500 hover:border-gray-400 disabled:opacity-30 text-sm"
                            >
                                ←
                            </button>
                            {getPageNumbers().map(page => (
                                <button
                                    key={page}
                                    onClick={() => fetchBoards(page)}
                                    className={`px-3 py-1 rounded text-sm ${page === currentPage
                                        ? 'bg-black text-white'
                                        : 'border border-gray-200 text-gray-500 hover:border-gray-400'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => fetchBoards(currentPage + 1)}
                                className="px-3 py-1 rounded border border-gray-200 text-gray-500 hover:border-gray-400 disabled:opacity-30 text-sm"
                            >
                                →
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Dashboard;
