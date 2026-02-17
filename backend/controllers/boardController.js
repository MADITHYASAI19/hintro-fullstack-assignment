const Board = require('../models/Board');
const Task = require('../models/Task');
const { logActivity } = require('./activityController');

exports.createBoard = async (req, res) => {
    const { title } = req.body;
    try {
        const newBoard = new Board({
            title,
            user: req.user.id
        });
        const board = await newBoard.save();

        // Log Activity: board created
        await logActivity({
            userId: req.user.id,
            actionType: 'created',
            entityType: 'board',
            entityId: board._id,
            boardId: board._id,
            metadata: { boardTitle: title }
        }, req.io);

        res.json(board);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

// GET /boards?page=1&limit=10
// Paginated list of boards for the authenticated user
exports.getBoards = async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    try {
        const query = { user: req.user.id };

        const [data, totalItems] = await Promise.all([
            Board.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Board.countDocuments(query)
        ]);

        res.json({
            data,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.getBoardById = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id)
            .populate('members', 'username email')
            .populate('user', 'username email')
            .populate({
                path: 'lists',
                populate: {
                    path: 'tasks',
                    model: 'Task',
                    populate: {
                        path: 'assignedTo',
                        select: 'username email'
                    }
                }
            });

        if (!board) {
            return res.status(404).json({ msg: 'Board not found' });
        }

        res.json(board);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Board not found' });
        }
        res.status(500).json({ msg: 'Server Error' });
    }
};

// GET /boards/:boardId/tasks?page=1&limit=10
// Paginated list of all tasks within a specific board
exports.getBoardTasks = async (req, res) => {
    const { boardId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    try {
        const query = { board: boardId };

        const [data, totalItems] = await Promise.all([
            Task.find(query)
                .sort({ position: 1 })
                .skip(skip)
                .limit(limit)
                .populate('assignedTo', 'username email')
                .populate('list', 'title'),
            Task.countDocuments(query)
        ]);

        res.json({
            data,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};
