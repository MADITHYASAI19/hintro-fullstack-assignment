const List = require('../models/List');
const Board = require('../models/Board');
const { logActivity } = require('./activityController');

exports.createList = async (req, res) => {
    const { title, boardId, position } = req.body;

    try {
        const newList = new List({
            title,
            board: boardId,
            position
        });

        const list = await newList.save();

        // Add list to board
        const board = await Board.findById(boardId);
        board.lists.push(list._id);
        await board.save();

        // Log Activity: list created
        await logActivity({
            userId: req.user.id,
            actionType: 'created',
            entityType: 'list',
            entityId: list._id,
            boardId,
            metadata: { listTitle: title }
        }, req.io);

        // Emit event
        req.io.to(boardId).emit('list_created', list);

        res.json(list);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.updateList = async (req, res) => {
    try {
        const list = await List.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!list) return res.status(404).json({ msg: 'List not found' });
        res.json(list);
    } catch (err) {
        res.status(500).json({ msg: 'Server Error' });
    }
};
