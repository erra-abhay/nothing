const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { validateFacultyCreation, validateDepartment, validateSubject, validateId, sanitizeHtml } = require('../middleware/validation');
const { logDataModification } = require('../middleware/securityLogger');
const fs = require('fs');
const path = require('path');

// Old admin login removed — use unified /api/auth/login instead

// ===== DEPARTMENT MANAGEMENT =====

// Get all departments
router.get('/departments', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [departments] = await db.query(`
            SELECT d.*, 
                   COUNT(DISTINCT s.id) as subject_count,
                   COUNT(DISTINCT p.id) as paper_count,
                   COUNT(DISTINCT u.id) as faculty_count
            FROM departments d
            LEFT JOIN subjects s ON d.id = s.department_id
            LEFT JOIN papers p ON d.id = p.department_id
            LEFT JOIN users u ON d.id = u.department_id AND u.role = 'faculty'
            GROUP BY d.id
            ORDER BY d.name
        `);
        res.json({ success: true, data: departments });
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

// Create department with validation
router.post('/departments', authenticateToken, isAdmin, validateDepartment, async (req, res) => {
    try {
        const { name, code } = req.body;

        if (!name || !code) {
            return res.status(400).json({ error: 'Name and code are required' });
        }

        const [result] = await db.query(
            'INSERT INTO departments (name, code) VALUES (?, ?)',
            [sanitizeHtml(name), sanitizeHtml(code)]
        );

        res.json({
            success: true,
            message: 'Department created successfully',
            data: { id: result.insertId },
            expiresIn: 1800
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Department name or code already exists' });
        }
        console.error('Error creating department:', error);
        res.status(500).json({ error: 'Failed to create department' });
    }
});

// Update department
router.put('/departments/:id', authenticateToken, isAdmin, validateId, async (req, res) => {
    try {
        const { name, code } = req.body;

        const updates = [];
        const params = [];

        if (name) {
            updates.push('name = ?');
            params.push(sanitizeHtml(name));
        }
        if (code) {
            updates.push('code = ?');
            params.push(sanitizeHtml(code));
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(req.params.id);

        await db.query(
            `UPDATE departments SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        res.json({ success: true, message: 'Department updated successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Department name or code already exists' });
        }
        console.error('Error updating department:', error);
        res.status(500).json({ error: 'Failed to update department' });
    }
});

// Delete department
router.delete('/departments/:id', authenticateToken, isAdmin, validateId, async (req, res) => {
    try {
        await db.query('DELETE FROM departments WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Department deleted successfully' });
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ error: 'Failed to delete department' });
    }
});

// ===== SUBJECT MANAGEMENT =====

// Get all subjects
router.get('/subjects', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [subjects] = await db.query(`
            SELECT s.*, d.name as department_name, d.code as department_code,
                   COUNT(p.id) as paper_count
            FROM subjects s
            JOIN departments d ON s.department_id = d.id
            LEFT JOIN papers p ON s.id = p.subject_id
            GROUP BY s.id
            ORDER BY d.name, s.name
        `);
        res.json({ success: true, data: subjects });
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ error: 'Failed to fetch subjects' });
    }
});

// Create subject with validation
router.post('/subjects', authenticateToken, isAdmin, validateSubject, async (req, res) => {
    try {
        const { name, code, department_id } = req.body;

        if (!name || !code || !department_id) {
            return res.status(400).json({ error: 'Name, code, and department_id are required' });
        }

        const [result] = await db.query(
            'INSERT INTO subjects (name, code, department_id) VALUES (?, ?, ?)',
            [name, code, department_id]
        );

        res.json({
            success: true,
            message: 'Subject created successfully',
            data: { id: result.insertId },
            expiresIn: 1800
        });
    } catch (error) {
        console.error('Error creating subject:', error);
        res.status(500).json({ error: 'Failed to create subject' });
    }
});

// Update subject
router.put('/subjects/:id', authenticateToken, isAdmin, validateId, async (req, res) => {
    try {
        const { name, code, department_id } = req.body;

        const updates = [];
        const params = [];

        if (name) {
            updates.push('name = ?');
            params.push(name);
        }
        if (code) {
            updates.push('code = ?');
            params.push(code);
        }
        if (department_id) {
            updates.push('department_id = ?');
            params.push(department_id);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(req.params.id);

        await db.query(
            `UPDATE subjects SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        res.json({ success: true, message: 'Subject updated successfully' });
    } catch (error) {
        console.error('Error updating subject:', error);
        res.status(500).json({ error: 'Failed to update subject' });
    }
});

// Delete subject
router.delete('/subjects/:id', authenticateToken, isAdmin, validateId, async (req, res) => {
    try {
        await db.query('DELETE FROM subjects WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Subject deleted successfully' });
    } catch (error) {
        console.error('Error deleting subject:', error);
        res.status(500).json({ error: 'Failed to delete subject' });
    }
});

// ===== FACULTY MANAGEMENT =====

// Get all faculty
router.get('/faculty', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [faculty] = await db.query(`
            SELECT u.id, u.name, u.email, u.is_active, u.created_at,
                   d.name as department_name, d.id as department_id,
                   COUNT(p.id) as paper_count
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            LEFT JOIN papers p ON u.id = p.uploaded_by
            WHERE u.role = 'faculty'
            GROUP BY u.id
            ORDER BY u.name
        `);
        res.json({ success: true, data: faculty });
    } catch (error) {
        console.error('Error fetching faculty:', error);
        res.status(500).json({ error: 'Failed to fetch faculty' });
    }
});

// Create faculty account with validation
router.post('/faculty', authenticateToken, isAdmin, validateFacultyCreation, async (req, res) => {
    try {
        const { name, email, password, department_id } = req.body;

        if (!name || !email || !password || !department_id) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            'INSERT INTO users (name, email, password, role, department_id) VALUES (?, ?, ?, ?, ?)',
            [sanitizeHtml(name), email, hashedPassword, 'faculty', department_id]
        );

        res.json({
            success: true,
            message: 'Faculty account created successfully',
            data: { id: result.insertId },
            expiresIn: 1800
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Email already exists' });
        }
        console.error('Error creating faculty:', error);
        res.status(500).json({ error: 'Failed to create faculty account' });
    }
});

// Update faculty
router.put('/faculty/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, email, password, department_id, is_active } = req.body;

        const updates = [];
        const params = [];

        if (name) {
            updates.push('name = ?');
            params.push(sanitizeHtml(name));
        }
        if (email) {
            updates.push('email = ?');
            params.push(email);
        }
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push('password = ?');
            params.push(hashedPassword);
        }
        if (department_id) {
            updates.push('department_id = ?');
            params.push(department_id);
        }
        if (typeof is_active === 'boolean') {
            updates.push('is_active = ?');
            params.push(is_active);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(req.params.id);

        await db.query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ? AND role = 'faculty'`,
            params
        );

        res.json({ success: true, message: 'Faculty updated successfully' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Email already exists' });
        }
        console.error('Error updating faculty:', error);
        res.status(500).json({ error: 'Failed to update faculty' });
    }
});

// Delete faculty
router.delete('/faculty/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM users WHERE id = ? AND role = ?', [req.params.id, 'faculty']);
        res.json({ success: true, message: 'Faculty deleted successfully' });
    } catch (error) {
        console.error('Error deleting faculty:', error);
        res.status(500).json({ error: 'Failed to delete faculty' });
    }
});

// ===== PAPER MANAGEMENT =====

// Get all papers
router.get('/papers', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [papers] = await db.query(`
            SELECT 
                p.id, p.semester, p.paper_type, p.year, p.original_filename, 
                p.download_count, p.created_at,
                s.name as subject_name, s.code as subject_code,
                d.name as department_name, d.code as department_code,
                u.name as uploaded_by, u.email as uploader_email
            FROM papers p
            JOIN subjects s ON p.subject_id = s.id
            JOIN departments d ON p.department_id = d.id
            JOIN users u ON p.uploaded_by = u.id
            ORDER BY p.created_at DESC
        `);
        res.json({ success: true, data: papers });
    } catch (error) {
        console.error('Error fetching papers:', error);
        res.status(500).json({ error: 'Failed to fetch papers' });
    }
});

// Delete any paper
router.delete('/papers/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const [papers] = await db.query('SELECT file_path FROM papers WHERE id = ?', [req.params.id]);

        if (papers.length === 0) {
            return res.status(404).json({ error: 'Paper not found' });
        }

        const filePath = path.resolve(__dirname, '..', papers[0].file_path);
        const uploadsRoot = path.resolve(__dirname, '..', 'uploads');

        // Path traversal protection
        if (!filePath.startsWith(uploadsRoot)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await db.query('DELETE FROM papers WHERE id = ?', [req.params.id]);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ success: true, message: 'Paper deleted successfully' });
    } catch (error) {
        console.error('Error deleting paper:', error);
        res.status(500).json({ error: 'Failed to delete paper' });
    }
});

module.exports = router;
