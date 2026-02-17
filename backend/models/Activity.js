const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // actionType categorizes the action performed (e.g., 'created', 'updated', 'deleted', 'moved', 'assigned')
    actionType: {
        type: String,
        required: true,
        enum: ['created', 'updated', 'deleted', 'moved', 'assigned', 'unassigned']
    },
    // entityType identifies what kind of entity was acted upon
    entityType: {
        type: String,
        required: true,
        enum: ['task', 'list', 'board']
    },
    // Reference to the specific entity that was acted upon
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    // The board this activity belongs to — used for querying and room-based emission
    boardId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        required: true
    },
    // Flexible metadata object for storing action-specific details
    // e.g., { taskTitle: "Fix bug", fromList: "To Do", toList: "In Progress" }
    metadata: {
        type: Object,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// INDEX: Compound index on boardId + timestamp for efficient paginated activity queries
// Queries always filter by boardId and sort by timestamp descending
ActivitySchema.index({ boardId: 1, timestamp: -1 });

module.exports = mongoose.model('Activity', ActivitySchema);
