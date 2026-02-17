const request = require('supertest');
const { app, io } = require('../server');
const { connect, close, clear } = require('./setup');
const mongoose = require('mongoose');

beforeAll(async () => {
    await connect();
});

afterAll(async () => {
    await close();
    if (io) io.close();
});

afterEach(async () => {
    await clear();
});

describe('Task Endpoints', () => {
    let token;
    let boardId;
    let listId;

    beforeEach(async () => {
        // 1. Register User
        const registerRes = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'Test User',
                email: 'test@example.com',
                password: 'password123'
            });

        token = registerRes.body.token;

        // 2. Create Board
        const boardRes = await request(app)
            .post('/api/boards')
            .set('x-auth-token', token)
            .send({ title: 'Test Board' });

        boardId = boardRes.body._id;

        // 3. Create List
        const listRes = await request(app)
            .post('/api/lists')
            .set('x-auth-token', token)
            .send({ title: 'Test List', boardId, position: 0 });

        listId = listRes.body._id;
    });

    describe('GET /api/tasks/search', () => {
        it('should return tasks matching the query in title', async () => {
            await request(app).post('/api/tasks').set('x-auth-token', token).send({
                title: 'Buy Milk', listId, boardId, position: 0
            });
            await request(app).post('/api/tasks').set('x-auth-token', token).send({
                title: 'Walk Dog', listId, boardId, position: 1
            });

            const res = await request(app)
                .get('/api/tasks/search?q=Milk')
                .set('x-auth-token', token);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].title).toBe('Buy Milk');
            expect(res.body.totalItems).toBe(1);
        });

        it('should search in description as well', async () => {
            await request(app).post('/api/tasks').set('x-auth-token', token).send({
                title: 'Task One', description: 'Get groceries from store', listId, boardId, position: 0
            });

            const res = await request(app)
                .get('/api/tasks/search?q=groceries')
                .set('x-auth-token', token);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].title).toBe('Task One');
        });

        it('should return empty data for empty query', async () => {
            const res = await request(app)
                .get('/api/tasks/search?q=')
                .set('x-auth-token', token);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(0);
            expect(res.body.totalItems).toBe(0);
        });

        it('should return empty data when no match', async () => {
            const res = await request(app)
                .get('/api/tasks/search?q=XYZ')
                .set('x-auth-token', token);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(0);
        });
    });

    describe('GET /api/tasks (Pagination)', () => {
        beforeEach(async () => {
            for (let i = 1; i <= 15; i++) {
                await request(app).post('/api/tasks').set('x-auth-token', token).send({
                    title: `Task ${i}`, listId, boardId, position: i
                });
            }
        });

        it('should return first page with 10 tasks', async () => {
            const res = await request(app)
                .get(`/api/tasks?boardId=${boardId}&page=1&limit=10`)
                .set('x-auth-token', token);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(10);
            expect(res.body.currentPage).toBe(1);
            expect(res.body.totalPages).toBe(2);
            expect(res.body.totalItems).toBe(15);
        });

        it('should return second page with 5 tasks', async () => {
            const res = await request(app)
                .get(`/api/tasks?boardId=${boardId}&page=2&limit=10`)
                .set('x-auth-token', token);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(5);
            expect(res.body.currentPage).toBe(2);
        });
    });

    describe('GET /api/boards (Pagination)', () => {
        it('should return paginated boards', async () => {
            const res = await request(app)
                .get('/api/boards?page=1&limit=10')
                .set('x-auth-token', token);

            expect(res.statusCode).toBe(200);
            expect(res.body.data).toBeDefined();
            expect(res.body.totalItems).toBe(1);
            expect(res.body.currentPage).toBe(1);
        });
    });

    describe('GET /api/boards/:boardId/tasks (Pagination)', () => {
        beforeEach(async () => {
            for (let i = 1; i <= 5; i++) {
                await request(app).post('/api/tasks').set('x-auth-token', token).send({
                    title: `Board Task ${i}`, listId, boardId, position: i
                });
            }
        });

        it('should return paginated tasks for a board', async () => {
            const res = await request(app)
                .get(`/api/boards/${boardId}/tasks?page=1&limit=3`)
                .set('x-auth-token', token);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBe(3);
            expect(res.body.totalItems).toBe(5);
            expect(res.body.totalPages).toBe(2);
        });
    });

    describe('GET /api/boards/:boardId/activity', () => {
        it('should return activity log after task creation', async () => {
            await request(app).post('/api/tasks').set('x-auth-token', token).send({
                title: 'Activity Test Task', listId, boardId, position: 0
            });

            const res = await request(app)
                .get(`/api/boards/${boardId}/activity?page=1&limit=10`)
                .set('x-auth-token', token);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.length).toBeGreaterThan(0);
            // Should include both board creation and task creation activities
            expect(res.body.totalItems).toBeGreaterThanOrEqual(1);
        });
    });
});
