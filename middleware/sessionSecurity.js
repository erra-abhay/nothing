const crypto = require('crypto');

// Generate device fingerprint from request
const generateFingerprint = (req) => {
    const components = [
        req.get('user-agent') || '',
        req.get('accept-language') || '',
        req.get('accept-encoding') || '',
        req.get('accept') || ''
    ];

    const fingerprintString = components.join('|');
    return crypto.createHash('sha256').update(fingerprintString).digest('hex');
};

// Store active sessions
const activeSessions = new Map();

// Maximum concurrent sessions per user
const MAX_CONCURRENT_SESSIONS = 3;

// Session validation middleware
const validateSession = async (req, res, next) => {
    if (!req.user) {
        return next();
    }

    const userId = req.user.id;
    const fingerprint = generateFingerprint(req);
    const sessionToken = req.user.sessionToken;

    // Get user's active sessions
    const userSessions = activeSessions.get(userId) || new Map();

    // Check if this session exists
    const existingSession = userSessions.get(sessionToken);

    if (existingSession) {
        // Verify fingerprint matches
        if (existingSession.fingerprint !== fingerprint) {
            // Possible session hijacking attempt
            console.warn(`Session hijacking attempt detected for user ${userId}`);
            return res.status(401).json({
                error: 'Session security violation detected. Please login again.',
                securityViolation: true
            });
        }

        // Update last activity
        existingSession.lastActivity = Date.now();
    } else {
        // New session - check concurrent session limit
        if (userSessions.size >= MAX_CONCURRENT_SESSIONS) {
            // Remove oldest session
            let oldestSession = null;
            let oldestTime = Date.now();

            for (const [token, session] of userSessions.entries()) {
                if (session.lastActivity < oldestTime) {
                    oldestTime = session.lastActivity;
                    oldestSession = token;
                }
            }

            if (oldestSession) {
                userSessions.delete(oldestSession);
            }
        }

        // Add new session
        userSessions.set(sessionToken, {
            fingerprint,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            ip: req.ip || req.connection.remoteAddress
        });

        activeSessions.set(userId, userSessions);
    }

    next();
};

// Clear user sessions (for logout)
const clearUserSession = (userId, sessionToken) => {
    const userSessions = activeSessions.get(userId);
    if (userSessions) {
        userSessions.delete(sessionToken);
        if (userSessions.size === 0) {
            activeSessions.delete(userId);
        }
    }
};

// Clear all user sessions (for forced logout)
const clearAllUserSessions = (userId) => {
    activeSessions.delete(userId);
};

// Clean up expired sessions (run periodically)
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

setInterval(() => {
    const now = Date.now();

    for (const [userId, userSessions] of activeSessions.entries()) {
        for (const [token, session] of userSessions.entries()) {
            if (now - session.lastActivity > SESSION_TIMEOUT) {
                userSessions.delete(token);
            }
        }

        if (userSessions.size === 0) {
            activeSessions.delete(userId);
        }
    }
}, 60000); // Clean up every minute

module.exports = {
    validateSession,
    clearUserSession,
    clearAllUserSessions,
    generateFingerprint
};
