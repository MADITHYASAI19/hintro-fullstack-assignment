const Task = require('../models/Task');
const List = require('../models/List');
const { logActivity } = require('./activityController');

exports.createTask = async (req, res) => {
    const { title, description, listId, boardId, position } = req.body;

    try {
        const newTask = new Task({
            title,
            description: description || '',
            list: listId,
            board: boardId,
            position
        });

        const task = await newTask.save();

        // Log Activity: task created
        await logActivity({
            userId: req.user.id,
            actionType: 'created',
            entityType: 'task',
            entityId: task._id,
            boardId,
            metadata: { taskTitle: title }
        }, req.io);

        req.io.to(boardId).emit('task_created', task);
        res.json(task);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const oldTask = await Task.findById(req.params.id);
        if (!oldTask) return res.status(404).json({ msg: 'Task not found' });

        const boardId = req.body.boardId || oldTask.board.toString();
        const oldListId = oldTask.list.toString();

        const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })
            .populate('assignedTo', 'username email');

        // Detect task move between lists
        if (req.body.listId && req.body.listId !== oldListId) {
            // Update the list field
            task.list = req.body.listId;
            await task.save();

            // Get list names for metadata
            const [fromList, toList] = await Promise.all([
                List.findById(oldListId),
                List.findById(req.body.listId)
            ]);

            await logActivity({
                userId: req.user.id,
                actionType: 'moved',
                entityType: 'task',
                entityId: task._id,
                boardId,
                metadata: {
                    taskTitle: task.title,
                    fromList: fromList?.title || 'Unknown',
                    toList: toList?.title || 'Unknown'
                }
            }, req.io);
        }

        // Detect assignment change
        if (req.body.assignedTo !== undefined) {
            const oldIds = (oldTask.assignedTo || []).map(id => id.toString()).sort();
            const newIds = (req.body.assignedTo || []).map(id => id.toString()).sort();

            if (JSON.stringify(oldIds) !== JSON.stringify(newIds)) {
                await logActivity({
                    userId: req.user.id,
                    actionType: 'assigned',
                    entityType: 'task',
                    entityId: task._id,
                    boardId,
                    metadata: { taskTitle: task.title }
                }, req.io);
            }
        }

        // Generic update activity (title, description, etc. changes)
        if (!req.body.listId && req.body.assignedTo === undefined) {
            if (req.body.title || req.body.description !== undefined) {
                await logActivity({
                    userId: req.user.id,
                    actionType: 'updated',
                    entityType: 'task',
                    entityId: task._id,
                    boardId,
                    metadata: { taskTitle: task.title }
                }, req.io);
            }
        }

        req.io.to(boardId).emit('task_updated', task);
        res.json(task);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ msg: 'Task not found' });

        const boardId = task.board.toString();
        const taskTitle = task.title;

        await Task.findByIdAndDelete(req.params.id);

        // Log Activity: task deleted
        await logActivity({
            userId: req.user.id,
            actionType: 'deleted',
            entityType: 'task',
            entityId: req.params.id,
            boardId,
            metadata: { taskTitle }
        }, req.io);

        req.io.to(boardId).emit('task_deleted', req.params.id);
        res.json({ msg: 'Task removed' });
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};

// GET /tasks?boardId=...&page=1&limit=10
// Standardized paginated response format
exports.getTasks = async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    try {
        const query = {};
        if (req.query.boardId) query.board = req.query.boardId;

        const [data, totalItems] = await Promise.all([
            Task.find(query)
                .sort({ position: 1 })
                .skip(skip)
                .limit(limit)
                .populate('assignedTo', 'username email'),
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

// GET /tasks/search?q=keyword&boardId=...&page=1&limit=10
// Searches both title and description with case-insensitive regex + pagination
exports.searchTasks = async (req, res) => {
    const { q, boardId } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    try {
        // Handle empty query safely — return empty result set
        if (!q || q.trim().length === 0) {
            return res.json({
                data: [],
                totalItems: 0,
                totalPages: 0,
                currentPage: page
            });
        }

        // Search in both title AND description with case-insensitive regex
        const searchRegex = { $regex: q, $options: 'i' };
        const query = {
            $or: [
                { title: searchRegex },
                { description: searchRegex }
            ]
        };

        if (boardId) query.board = boardId;

        const [data, totalItems] = await Promise.all([
            Task.find(query)
                .sort({ position: 1 })
                .skip(skip)
                .limit(limit)
                .populate('assignedTo', 'username email'),
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
