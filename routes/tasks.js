const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const auth = require('../middleware/auth');
const role = require('../middleware/role');

// ─── GET ALL TASKS ────────────────────────────────────
// Admin sees all tasks from all users
// Regular user sees only their own tasks
router.get('/', auth, async (req, res) => {
  try {
    const { status, search, sort } = req.query;
    let query;
    let params = [];

    if (req.user.role === 'admin') {
      // Admin query — joins with users table to show who owns each task
      query = `SELECT tasks.*, users.username 
               FROM tasks 
               JOIN users ON tasks.user_id = users.id 
               WHERE 1=1`;
    } else {
      // Regular user — only their tasks
      query = 'SELECT * FROM tasks WHERE user_id = ?';
      params.push(req.user.id);
    }

    // Optional filter by status
    if (status) {
      query += ' AND tasks.status = ?';
      params.push(status);
    }

    // Optional search in title or description
    if (search) {
      query += ' AND (tasks.title LIKE ? OR tasks.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // Sorting
    if (sort === 'oldest') query += ' ORDER BY tasks.created_at ASC';
    else if (sort === 'title_asc') query += ' ORDER BY tasks.title ASC';
    else if (sort === 'title_desc') query += ' ORDER BY tasks.title DESC';
    else query += ' ORDER BY tasks.created_at DESC'; // default: newest first

    const [tasks] = await pool.query(query, params);
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── GET ONE TASK ─────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const [tasks] = await pool.query(
      'SELECT * FROM tasks WHERE id = ?',
      [req.params.id]
    );

    if (tasks.length === 0)
      return res.status(404).json({ success: false, message: 'Task not found.' });

    const task = tasks[0];

    // Block regular user from seeing someone else's task
    if (req.user.role !== 'admin' && task.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── CREATE TASK ──────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { title, description = '', status = 'To Do' } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Title is required.' });
    }

    // user_id comes from the JWT token — users can't fake their own ID
    const [result] = await pool.query(
      'INSERT INTO tasks (title, description, status, user_id) VALUES (?, ?, ?, ?)',
      [title, description, status, req.user.id]
    );

    const [tasks] = await pool.query(
      'SELECT * FROM tasks WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Task created.',
      data: tasks[0],
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── UPDATE TASK (full) ───────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const [tasks] = await pool.query(
      'SELECT * FROM tasks WHERE id = ?',
      [req.params.id]
    );

    if (tasks.length === 0)
      return res.status(404).json({ success: false, message: 'Task not found.' });

    const task = tasks[0];

    if (req.user.role !== 'admin' && task.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const { title = task.title, description = task.description, status = task.status } = req.body;

    await pool.query(
      'UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?',
      [title, description, status, req.params.id]
    );

    const [updated] = await pool.query(
      'SELECT * FROM tasks WHERE id = ?',
      [req.params.id]
    );

    res.json({ success: true, message: 'Task updated.', data: updated[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── UPDATE TASK (partial) ────────────────────────────
router.patch('/:id', auth, async (req, res) => {
  try {
    const [tasks] = await pool.query(
      'SELECT * FROM tasks WHERE id = ?',
      [req.params.id]
    );

    if (tasks.length === 0)
      return res.status(404).json({ success: false, message: 'Task not found.' });

    const task = tasks[0];

    if (req.user.role !== 'admin' && task.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Use new value if provided, otherwise keep existing value
    const title = req.body.title ?? task.title;
    const description = req.body.description ?? task.description;
    const status = req.body.status ?? task.status;

    await pool.query(
      'UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?',
      [title, description, status, req.params.id]
    );

    const [updated] = await pool.query(
      'SELECT * FROM tasks WHERE id = ?',
      [req.params.id]
    );

    res.json({ success: true, message: 'Task updated.', data: updated[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── DELETE TASK ──────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const [tasks] = await pool.query(
      'SELECT * FROM tasks WHERE id = ?',
      [req.params.id]
    );

    if (tasks.length === 0)
      return res.status(404).json({ success: false, message: 'Task not found.' });

    const task = tasks[0];

    if (req.user.role !== 'admin' && task.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await pool.query('DELETE FROM tasks WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Task deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── ADMIN ONLY — see all tasks with user info ────────
router.get('/admin/all', auth, role('admin'), async (req, res) => {
  try {
    const [tasks] = await pool.query(
      `SELECT tasks.*, users.username, users.email 
       FROM tasks 
       JOIN users ON tasks.user_id = users.id 
       ORDER BY tasks.created_at DESC`
    );
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;