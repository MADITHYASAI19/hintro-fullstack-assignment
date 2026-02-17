const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    position: {
        type: Number,
        required: true
    },
    list: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'List',
        required: true
    },
    board: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Board',
        required: true
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    dueDate: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// INDEX: Text index on title and description for efficient full-text search
// Enables $text queries and optimizes regex-based search on these fields
TaskSchema.index({ title: 'text', description: 'text' });

// INDEX: Index on board field for fast lookup of all tasks in a board
// Most queries filter tasks by board (pagination, search within board)
TaskSchema.index({ board: 1 });

// INDEX: Index on assignedTo for efficient filtering by user assignment
TaskSchema.index({ assignedTo: 1 });

// INDEX: Compound index for sorting tasks within a list by position
TaskSchema.index({ list: 1, position: 1 });

module.exports = mongoose.model('Task', TaskSchema);
