const jwt = require('jsonwebtoken');
const db = require('../config/database');
const { validateSession } = require('./sessionSecurity');
const { logSecurityEvent, EventTypes } = require('./securityLogger');
require('dotenv').config();

// Session timeout in milliseconds (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

// Ensure JWT secret is set
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'your_jwt_secret_key_change_this_in_production') {
    console.warn('⚠️  WARNING: Using default JWT secret. Please change JWT_SECRET in .env file for production!');
}

// Middleware to verify JWT token and session
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        logSecurityEvent(EventTypes.UNAUTHORIZED_ACCESS, {
            reason: 'No token provided',
            path: req.path,
            ip: req.ip
        });
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
        if (err) {
            // Check if token is expired
            if (err.name === 'TokenExpiredError') {
                logSecurityEvent(EventTypes.SESSION_EXPIRED, {
                    userId: user ? user.id : null,
                    ip: req.ip,
                    path: req.path
                });
                return res.status(401).json({ error: 'Session expired. Please login again.', expired: true });
            }

            logSecurityEvent(EventTypes.INVALID_TOKEN, {
                reason: err.name,
                ip: req.ip,
                path: req.path
            });
            return res.status(403).json({ error: 'Invalid token' });
        }

        try {
            // Verify session token in database
            const [users] = await db.query(
                'SELECT session_token, session_created_at FROM users WHERE id = ?',
                [user.id]
            );

            if (users.length === 0) {
                logSecurityEvent(EventTypes.UNAUTHORIZED_ACCESS, {
                    reason: 'User not found',
                    userId: user.id,
                    ip: req.ip,
                    path: req.path
                });
                return res.status(403).json({ error: 'User not found' });
            }

            const dbUser = users[0];

            // Check if session token matches
            if (dbUser.session_token !== user.sessionToken) {
                logSecurityEvent(EventTypes.UNAUTHORIZED_ACCESS, {
                    reason: 'Session token mismatch',
                    userId: user.id,
                    ip: req.ip,
                    path: req.path
                });
                return res.status(401).json({
                    error: 'Session invalid. You have been logged out because you logged in from another device.',
                    loggedOutFromOtherDevice: true
                });
            }

            // Check session timeout (30 minutes)
            if (dbUser.session_created_at) {
                const sessionAge = Date.now() - new Date(dbUser.session_created_at).getTime();
                if (sessionAge > SESSION_TIMEOUT) {
                    // Clear session
                    await db.query(
                        'UPDATE users SET session_token = NULL, session_created_at = NULL WHERE id = ?',
                        [user.id]
                    );

                    logSecurityEvent(EventTypes.SESSION_EXPIRED, {
                        userId: user.id,
                        ip: req.ip,
                        sessionAge: Math.floor(sessionAge / 1000 / 60) + ' minutes'
                    });

                    return res.status(401).json({
                        error: 'Session expired after 30 minutes of inactivity. Please login again.',
                        expired: true
                    });
                }

                // Update session timestamp to extend session
                await db.query(
                    'UPDATE users SET session_created_at = NOW() WHERE id = ?',
                    [user.id]
                );
            }

            // Add user info to request
            req.user = user;

            // Validate session security (device fingerprinting)
            await validateSession(req, res, () => {
                next();
            });
        } catch (error) {
            console.error('Session validation error:', error);
            logSecurityEvent('ERROR', {
                type: 'Session validation error',
                error: error.message,
                userId: user ? user.id : null,
                ip: req.ip
            });
            return res.status(500).json({ error: 'Session validation failed' });
        }
    });
};

// Middleware to check if user is faculty
const isFaculty = (req, res, next) => {
    if (req.user.role !== 'faculty') {
        logSecurityEvent(EventTypes.UNAUTHORIZED_ACCESS, {
            reason: 'Not faculty',
            userId: req.user.id,
            role: req.user.role,
            path: req.path,
            ip: req.ip
        });
        return res.status(403).json({ error: 'Faculty access required' });
    }
    next();
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        logSecurityEvent(EventTypes.UNAUTHORIZED_ACCESS, {
            reason: 'Not admin',
            userId: req.user.id,
            role: req.user.role,
            path: req.path,
            ip: req.ip
        });
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

module.exports = {
    authenticateToken,
    isFaculty,
    isAdmin
};
