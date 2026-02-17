import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Task from '../components/Task';

// Mock react-beautiful-dnd because it doesn't work well in JSDOM
vi.mock('react-beautiful-dnd', () => ({
    Droppable: ({ children }) => children({
        droppableProps: {
            style: {},
        },
        innerRef: vi.fn(),
        placeholder: null,
    }, {}),
    Draggable: ({ children }) => children({
        draggableProps: {
            style: {},
        },
        innerRef: vi.fn(),
        dragHandleProps: {},
    }, {
        isDragging: false,
    }),
    DragDropContext: ({ children }) => <div>{children}</div>,
}));

const renderTask = (task, members = []) => {
    return render(
        <Task task={task} index={0} members={members} />
    );
};

describe('Task Component', () => {
    it('renders task title correctly', () => {
        const mockTask = { _id: '1', title: 'Test Task', position: 0 };
        renderTask(mockTask);
        expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('renders task description if present', () => {
        const mockTask = { _id: '1', title: 'Test Task', description: 'Some description', position: 0 };
        renderTask(mockTask);
        expect(screen.getByText('Some description')).toBeInTheDocument();
    });

    it('shows assigned user avatars', () => {
        const mockTask = {
            _id: '1',
            title: 'Test Task',
            position: 0,
            assignedTo: [
                { _id: 'u1', username: 'Alice' },
                { _id: 'u2', username: 'Bob' }
            ]
        };
        renderTask(mockTask);
        expect(screen.getByTitle('Alice')).toBeInTheDocument();
        expect(screen.getByTitle('Bob')).toBeInTheDocument();
    });

    it('shows delete button on task', () => {
        const mockTask = { _id: '1', title: 'Test Task', position: 0 };
        renderTask(mockTask);
        expect(screen.getByTitle('Delete Task')).toBeInTheDocument();
    });

    it('shows assign button on task', () => {
        const mockTask = { _id: '1', title: 'Test Task', position: 0 };
        renderTask(mockTask);
        expect(screen.getByTitle('Assign Members')).toBeInTheDocument();
    });
});
