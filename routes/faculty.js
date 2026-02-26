const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { authenticateToken, isFaculty } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { verifyFileContent } = require('../middleware/upload');
const { validatePaperUpload, validatePaperUpdate, validateId } = require('../middleware/validation');
const { logDataModification } = require('../middleware/securityLogger');
const fs = require('fs');
const path = require('path');

// Old faculty login removed — use unified /api/auth/login instead

// Get subjects for faculty's department
router.get('/subjects', authenticateToken, isFaculty, async (req, res) => {
    try {
        const [subjects] = await db.query(`
            SELECT s.*, d.name as department_name
            FROM subjects s
            JOIN departments d ON s.department_id = d.id
            WHERE s.department_id = ?
            ORDER BY s.name
        `, [req.user.department_id]);

        res.json({ success: true, data: subjects });
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ error: 'Failed to fetch subjects' });
    }
});

// Upload new paper with validation
router.post('/papers', authenticateToken, isFaculty, upload.single('file'), verifyFileContent, validatePaperUpload, async (req, res) => {
    try {
        const { subject_id, semester, paper_type, year } = req.body;

        if (!subject_id || !semester || !paper_type || !year || !req.file) {
            // Delete uploaded file if validation fails
            if (req.file) {
                fs.unlinkSync(req.file.path);
            }
            return res.status(400).json({ error: 'All fields are required including file' });
        }

        // Verify subject belongs to faculty's department
        const [subjects] = await db.query(
            'SELECT * FROM subjects WHERE id = ? AND department_id = ?',
            [subject_id, req.user.department_id]
        );

        if (subjects.length === 0) {
            fs.unlinkSync(req.file.path);
            return res.status(403).json({ error: 'Subject does not belong to your department' });
        }

        // Store relative path
        const relativePath = path.relative(process.cwd(), req.file.path);

        const [result] = await db.query(`
            INSERT INTO papers (subject_id, department_id, semester, paper_type, year, file_path, original_filename, uploaded_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [subject_id, req.user.department_id, semester, paper_type, year, relativePath, req.file.originalname, req.user.id]);

        res.json({
            success: true,
            message: 'Paper uploaded successfully',
            data: { id: result.insertId },
            expiresIn: 1800
        });
    } catch (error) {
        console.error('Upload error:', error);
        // Clean up file on error
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to upload paper' });
    }
});

// Get faculty's uploaded papers
router.get('/papers', authenticateToken, isFaculty, async (req, res) => {
    try {
        const [papers] = await db.query(`
            SELECT 
                p.id, p.semester, p.paper_type, p.year, p.original_filename, 
                p.download_count, p.created_at, p.updated_at,
                s.name as subject_name, s.code as subject_code,
                d.name as department_name
            FROM papers p
            JOIN subjects s ON p.subject_id = s.id
            JOIN departments d ON p.department_id = d.id
            WHERE p.uploaded_by = ?
            ORDER BY p.created_at DESC
        `, [req.user.id]);

        res.json({ success: true, data: papers });
    } catch (error) {
        console.error('Error fetching papers:', error);
        res.status(500).json({ error: 'Failed to fetch papers' });
    }
});

// Update paper metadata with validation
router.put('/papers/:id', authenticateToken, isFaculty, validateId, validatePaperUpdate, async (req, res) => {
    try {
        const { subject_id, semester, paper_type, year } = req.body;

        // Verify paper belongs to faculty
        const [papers] = await db.query(
            'SELECT * FROM papers WHERE id = ? AND uploaded_by = ?',
            [req.params.id, req.user.id]
        );

        if (papers.length === 0) {
            return res.status(404).json({ error: 'Paper not found or access denied' });
        }

        // If subject_id is being changed, verify it belongs to faculty's department
        if (subject_id) {
            const [subjects] = await db.query(
                'SELECT * FROM subjects WHERE id = ? AND department_id = ?',
                [subject_id, req.user.department_id]
            );

            if (subjects.length === 0) {
                return res.status(403).json({ error: 'Subject does not belong to your department' });
            }
        }

        const updates = [];
        const params = [];

        if (subject_id) {
            updates.push('subject_id = ?');
            params.push(subject_id);
        }
        if (semester) {
            updates.push('semester = ?');
            params.push(semester);
        }
        if (paper_type) {
            updates.push('paper_type = ?');
            params.push(paper_type);
        }
        if (year) {
            updates.push('year = ?');
            params.push(year);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        params.push(req.params.id);

        await db.query(
            `UPDATE papers SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        logDataModification('update', {
            table: 'papers',
            paperId: req.params.id,
            userId: req.user.id,
            ip: req.ip,
            changes: updates
        });

        res.json({ success: true, message: 'Paper updated successfully' });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({ error: 'Failed to update paper' });
    }
});

// Delete paper with validation
router.delete('/papers/:id', authenticateToken, isFaculty, validateId, async (req, res) => {
    try {
        // Get paper details
        const [papers] = await db.query(
            'SELECT file_path FROM papers WHERE id = ? AND uploaded_by = ?',
            [req.params.id, req.user.id]
        );

        if (papers.length === 0) {
            return res.status(404).json({ error: 'Paper not found or access denied' });
        }

        const filePath = path.resolve(__dirname, '..', papers[0].file_path);
        const uploadsRoot = path.resolve(__dirname, '..', 'uploads');

        // Path traversal protection
        if (!filePath.startsWith(uploadsRoot)) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Delete from database
        await db.query('DELETE FROM papers WHERE id = ?', [req.params.id]);

        // Delete file from filesystem
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        logDataModification('delete', {
            table: 'papers',
            paperId: req.params.id,
            userId: req.user.id,
            ip: req.ip,
            filename: papers[0].file_path
        });

        res.json({ success: true, message: 'Paper deleted successfully' });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({ error: 'Failed to delete paper' });
    }
});

module.exports = router;
