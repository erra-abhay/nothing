const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { validateLogin } = require('../middleware/validation');
const { trackLoginAttempt, isAccountLocked, getRemainingLockoutTime } = require('../middleware/securityLogger');

// Unified login - auto-detects role from database
router.post('/login', validateLogin, async (req, res) => {
    try {
        const { email, password } = req.body;
        const ip = req.ip || req.connection.remoteAddress;

        // Check if account is locked
        if (isAccountLocked(email, ip)) {
            const remainingTime = getRemainingLockoutTime(email, ip);
            return res.status(429).json({
                error: `Account temporarily locked due to too many failed login attempts. Please try again in ${remainingTime} minutes.`,
                lockedUntil: remainingTime
            });
        }

        // Search for user in DB regardless of role
        const [users] = await db.query(
            'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
            [email]
        );

        if (users.length === 0) {
            trackLoginAttempt(email, false, ip, { reason: 'User not found' });
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            trackLoginAttempt(email, false, ip, { role: user.role, reason: 'Invalid password' });
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate unique session token
        const sessionToken = crypto.randomBytes(32).toString('hex');

        // Update user's session token
        await db.query(
            'UPDATE users SET session_token = ?, session_created_at = UTC_TIMESTAMP() WHERE id = ?',
            [sessionToken, user.id]
        );

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role, department_id: user.department_id, sessionToken: sessionToken },
            process.env.JWT_SECRET,
            { expiresIn: '30m' }
        );

        // Track successful login
        trackLoginAttempt(email, true, ip, { role: user.role, userId: user.id });

        res.json({
            success: true,
            token,
            role: user.role,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                department_id: user.department_id
            },
            expiresIn: 1800
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

module.exports = router;
