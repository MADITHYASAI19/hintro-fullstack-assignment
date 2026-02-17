const Activity = require('../models/Activity');

/**
 * Reusable helper to log an activity and emit it via Socket.io
 * @param {Object} params - Activity parameters
 * @param {string} params.userId - The user performing the action
 * @param {string} params.actionType - 'created' | 'updated' | 'deleted' | 'moved' | 'assigned' | 'unassigned'
 * @param {string} params.entityType - 'task' | 'list' | 'board'
 * @param {string} params.entityId - The ID of the entity acted upon
 * @param {string} params.boardId - The board this activity belongs to
 * @param {Object} params.metadata - Additional context (e.g., { taskTitle, fromList, toList })
 * @param {Object} io - Socket.io server instance for real-time emission
 */
const logActivity = async ({ userId, actionType, entityType, entityId, boardId, metadata = {} }, io) => {
    try {
        const activity = new Activity({
            user: userId,
            actionType,
            entityType,
            entityId,
            boardId,
            metadata
        });
        const saved = await activity.save();

        // Populate user info before emitting
        const populated = await Activity.findById(saved._id).populate('user', 'username email');

        // Emit real-time event to all users viewing this board
        if (io) {
            io.to(boardId.toString()).emit('activity_created', populated);
        }

        return saved;
    } catch (err) {
        console.error('Failed to log activity:', err.message);
    }
};

/**
 * GET /api/boards/:boardId/activity?page=1&limit=20
 * Returns paginated activity history for a board
 */
const getActivities = async (req, res) => {
    const { boardId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    try {
        const totalItems = await Activity.countDocuments({ boardId });
        const activities = await Activity.find({ boardId })
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'username email');

        res.json({
            data: activities,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

module.exports = { logActivity, getActivities };
