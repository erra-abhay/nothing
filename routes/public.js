const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { validateId, validateSearch, validatePagination } = require('../middleware/validation');
const path = require('path');
const fs = require('fs');

// Get all papers with optional filters and validation
router.get('/papers', validatePagination, async (req, res) => {
    try {
        const { department, subject, semester, type, year, limit = 50, offset = 0 } = req.query;

        let query = `
            SELECT 
                p.id, p.semester, p.paper_type, p.year, p.original_filename, 
                p.download_count, p.created_at,
                s.name as subject_name, s.code as subject_code,
                d.name as department_name, d.code as department_code,
                u.name as uploaded_by
            FROM papers p
            JOIN subjects s ON p.subject_id = s.id
            JOIN departments d ON p.department_id = d.id
            JOIN users u ON p.uploaded_by = u.id
            WHERE 1=1
        `;

        const params = [];

        if (department) {
            query += ' AND (d.id = ? OR d.code = ?)';
            params.push(department, department);
        }
        if (subject) {
            query += ' AND (s.id = ? OR s.code = ?)';
            params.push(subject, subject);
        }
        if (semester) {
            query += ' AND p.semester = ?';
            params.push(semester);
        }
        if (type) {
            query += ' AND p.paper_type = ?';
            params.push(type);
        }
        if (year) {
            query += ' AND p.year = ?';
            params.push(year);
        }

        query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), parseInt(offset));

        const [papers] = await db.query(query, params);
        res.json({ success: true, data: papers, count: papers.length });
    } catch (error) {
        console.error('Error fetching papers:', error);
        res.status(500).json({ error: 'Failed to fetch papers' });
    }
});

// Get paper details by ID with validation
router.get('/papers/:id', validateId, async (req, res) => {
    try {
        const [papers] = await db.query(`
            SELECT 
                p.id, p.semester, p.paper_type, p.year, p.original_filename, 
                p.download_count, p.created_at,
                s.name as subject_name, s.code as subject_code,
                d.name as department_name, d.code as department_code,
                u.name as uploaded_by
            FROM papers p
            JOIN subjects s ON p.subject_id = s.id
            JOIN departments d ON p.department_id = d.id
            JOIN users u ON p.uploaded_by = u.id
            WHERE p.id = ?
        `, [req.params.id]);

        if (papers.length === 0) {
            return res.status(404).json({ error: 'Paper not found' });
        }

        res.json({ success: true, data: papers[0] });
    } catch (error) {
        console.error('Error fetching paper:', error);
        res.status(500).json({ error: 'Failed to fetch paper' });
    }
});

// Download paper with validation
router.get('/papers/:id/download', validateId, async (req, res) => {
    try {
        const [papers] = await db.query('SELECT file_path, original_filename FROM papers WHERE id = ?', [req.params.id]);

        if (papers.length === 0) {
            return res.status(404).json({ error: 'Paper not found' });
        }

        const paper = papers[0];
        const filePath = path.join(__dirname, '..', paper.file_path);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }

        // Increment download count
        await db.query('UPDATE papers SET download_count = download_count + 1 WHERE id = ?', [req.params.id]);

        res.download(filePath, paper.original_filename);
    } catch (error) {
        console.error('Error downloading paper:', error);
        res.status(500).json({ error: 'Failed to download paper' });
    }
});

// Search papers with validation
router.get('/search', validateSearch, async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length === 0) {
            return res.json({ success: true, data: [] });
        }

        const searchTerm = `%${q}%`;

        const [results] = await db.query(`
            SELECT DISTINCT
                p.id, p.semester, p.paper_type, p.year, p.original_filename, 
                p.download_count, p.created_at,
                s.name as subject_name, s.code as subject_code,
                d.name as department_name, d.code as department_code,
                u.name as uploaded_by
            FROM papers p
            JOIN subjects s ON p.subject_id = s.id
            JOIN departments d ON p.department_id = d.id
            JOIN users u ON p.uploaded_by = u.id
            WHERE s.name LIKE ? OR s.code LIKE ? OR d.name LIKE ? OR d.code LIKE ?
            ORDER BY p.download_count DESC, p.created_at DESC
            LIMIT 100
        `, [searchTerm, searchTerm, searchTerm, searchTerm]);

        res.json({ success: true, data: results, count: results.length });
    } catch (error) {
        console.error('Error searching papers:', error);
        res.status(500).json({ error: 'Failed to search papers' });
    }
});

// Get all departments
router.get('/departments', async (req, res) => {
    try {
        const [departments] = await db.query(`
            SELECT d.*, COUNT(p.id) as paper_count
            FROM departments d
            LEFT JOIN papers p ON d.id = p.department_id
            GROUP BY d.id
            ORDER BY d.name
        `);
        res.json({ success: true, data: departments });
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

// Get subjects (optionally filtered by department)
router.get('/subjects', async (req, res) => {
    try {
        const { department } = req.query;

        let query = `
            SELECT s.*, d.name as department_name, d.code as department_code,
                   COUNT(p.id) as paper_count
            FROM subjects s
            JOIN departments d ON s.department_id = d.id
            LEFT JOIN papers p ON s.id = p.subject_id
        `;

        const params = [];
        if (department) {
            query += ' WHERE s.department_id = ? OR d.code = ?';
            params.push(department, department);
        }

        query += ' GROUP BY s.id ORDER BY s.name';

        const [subjects] = await db.query(query, params);
        res.json({ success: true, data: subjects });
    } catch (error) {
        console.error('Error fetching subjects:', error);
        res.status(500).json({ error: 'Failed to fetch subjects' });
    }
});

// Get homepage statistics
router.get('/stats', async (req, res) => {
    try {
        // Most downloaded papers
        const [mostDownloaded] = await db.query(`
            SELECT 
                p.id, p.semester, p.paper_type, p.year, p.download_count,
                s.name as subject_name, s.code as subject_code,
                d.name as department_name, d.code as department_code
            FROM papers p
            JOIN subjects s ON p.subject_id = s.id
            JOIN departments d ON p.department_id = d.id
            ORDER BY p.download_count DESC
            LIMIT 10
        `);

        // Recently uploaded papers
        const [recentUploads] = await db.query(`
            SELECT 
                p.id, p.semester, p.paper_type, p.year, p.created_at,
                s.name as subject_name, s.code as subject_code,
                d.name as department_name, d.code as department_code,
                u.name as uploaded_by
            FROM papers p
            JOIN subjects s ON p.subject_id = s.id
            JOIN departments d ON p.department_id = d.id
            JOIN users u ON p.uploaded_by = u.id
            ORDER BY p.created_at DESC
            LIMIT 10
        `);

        // Most downloaded subjects
        const [topSubjects] = await db.query(`
            SELECT 
                s.id, s.name, s.code,
                d.name as department_name,
                SUM(p.download_count) as total_downloads,
                COUNT(p.id) as paper_count
            FROM subjects s
            JOIN departments d ON s.department_id = d.id
            LEFT JOIN papers p ON s.id = p.subject_id
            GROUP BY s.id
            ORDER BY total_downloads DESC
            LIMIT 10
        `);

        // Total counts
        const [counts] = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM papers) as total_papers,
                (SELECT COUNT(*) FROM subjects) as total_subjects,
                (SELECT COUNT(*) FROM departments) as total_departments,
                (SELECT SUM(download_count) FROM papers) as total_downloads
        `);

        res.json({
            success: true,
            data: {
                mostDownloaded,
                recentUploads,
                topSubjects,
                counts: counts[0]
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

module.exports = router;
