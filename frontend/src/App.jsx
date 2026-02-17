import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import BoardPage from './pages/BoardPage';
import { useState, useEffect } from 'react';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) setIsAuthenticated(true);
        setLoading(false);
    }, []);

    const setAuth = (val) => setIsAuthenticated(val);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <p className="text-gray-400 text-sm">Loading...</p>
        </div>
    );

    return (
        <Router>
            <div className="min-h-screen bg-white">
                <nav className="border-b border-gray-200 px-6 py-3 sticky top-0 z-50 bg-white">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <Link to={isAuthenticated ? "/dashboard" : "/login"} className="text-xl font-bold text-black tracking-tight">
                            TaskFlow
                        </Link>

                        {isAuthenticated && (
                            <div className="flex items-center gap-4">
                                <Link to="/dashboard" className="text-gray-500 hover:text-black text-sm font-medium">
                                    Dashboard
                                </Link>
                                <button
                                    onClick={() => { localStorage.removeItem('token'); setAuth(false); }}
                                    className="px-4 py-2 rounded text-sm font-medium text-gray-500 hover:text-black border border-gray-200 hover:border-gray-400"
                                >
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </nav>

                <Routes>
                    <Route path="/login" element={!isAuthenticated ? <Login setAuth={setAuth} /> : <Navigate to="/dashboard" />} />
                    <Route path="/signup" element={!isAuthenticated ? <Signup setAuth={setAuth} /> : <Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
                    <Route path="/board/:id" element={isAuthenticated ? <BoardPage /> : <Navigate to="/login" />} />
                    <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
