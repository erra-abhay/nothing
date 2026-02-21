const fs = require('fs');
const path = require('path');

// Security event types
const EventTypes = {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGOUT: 'LOGOUT',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
    FILE_UPLOAD: 'FILE_UPLOAD',
    FILE_UPLOAD_REJECTED: 'FILE_UPLOAD_REJECTED',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
    SQL_INJECTION_ATTEMPT: 'SQL_INJECTION_ATTEMPT',
    XSS_ATTEMPT: 'XSS_ATTEMPT',
    PATH_TRAVERSAL_ATTEMPT: 'PATH_TRAVERSAL_ATTEMPT',
    CSRF_VIOLATION: 'CSRF_VIOLATION',
    DATA_MODIFICATION: 'DATA_MODIFICATION',
    DATA_DELETION: 'DATA_DELETION'
};

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Get log file path for today
const getLogFilePath = () => {
    const date = new Date().toISOString().split('T')[0];
    return path.join(logsDir, `security-${date}.log`);
};

// Format log entry
const formatLogEntry = (event) => {
    return JSON.stringify({
        timestamp: new Date().toISOString(),
        ...event
    }) + '\n';
};

// Write log entry
const writeLog = (event) => {
    const logEntry = formatLogEntry(event);
    const logFile = getLogFilePath();

    fs.appendFile(logFile, logEntry, (err) => {
        if (err) {
            console.error('Failed to write security log:', err);
        }
    });
};

// Log security event
const logSecurityEvent = (type, details = {}) => {
    const event = {
        type,
        ...details
    };

    writeLog(event);

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.log(`[SECURITY] ${type}:`, details);
    }
};

// Middleware to log all requests
const logRequest = (req, res, next) => {
    const startTime = Date.now();

    // Log response when finished
    res.on('finish', () => {
        const duration = Date.now() - startTime;

        // Log suspicious status codes
        if (res.statusCode >= 400) {
            logSecurityEvent('REQUEST', {
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.get('user-agent'),
                duration,
                userId: req.user ? req.user.id : null
            });
        }
    });

    next();
};

// Track failed login attempts
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

const trackLoginAttempt = (email, success, ip, details = {}) => {
    const key = `${email}:${ip}`;

    if (success) {
        // Clear failed attempts on successful login
        loginAttempts.delete(key);
        logSecurityEvent(EventTypes.LOGIN_SUCCESS, {
            email,
            ip,
            ...details
        });
    } else {
        // Track failed attempt
        const attempts = loginAttempts.get(key) || { count: 0, firstAttempt: Date.now() };
        attempts.count++;
        attempts.lastAttempt = Date.now();
        loginAttempts.set(key, attempts);

        logSecurityEvent(EventTypes.LOGIN_FAILED, {
            email,
            ip,
            attemptCount: attempts.count,
            ...details
        });

        // Check if account should be locked
        if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
            logSecurityEvent(EventTypes.ACCOUNT_LOCKED, {
                email,
                ip,
                attemptCount: attempts.count,
                lockoutDuration: LOCKOUT_DURATION
            });
        }
    }
};

const isAccountLocked = (email, ip) => {
    const key = `${email}:${ip}`;
    const attempts = loginAttempts.get(key);

    if (!attempts || attempts.count < MAX_LOGIN_ATTEMPTS) {
        return false;
    }

    // Check if lockout period has expired
    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    if (timeSinceLastAttempt > LOCKOUT_DURATION) {
        loginAttempts.delete(key);
        return false;
    }

    return true;
};

const getRemainingLockoutTime = (email, ip) => {
    const key = `${email}:${ip}`;
    const attempts = loginAttempts.get(key);

    if (!attempts) return 0;

    const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
    const remaining = LOCKOUT_DURATION - timeSinceLastAttempt;

    return remaining > 0 ? Math.ceil(remaining / 1000 / 60) : 0; // Return minutes
};

// Log file upload attempts
const logFileUpload = (success, details) => {
    logSecurityEvent(
        success ? EventTypes.FILE_UPLOAD : EventTypes.FILE_UPLOAD_REJECTED,
        details
    );
};

// Log data modifications
const logDataModification = (action, details) => {
    const eventType = action === 'delete' ? EventTypes.DATA_DELETION : EventTypes.DATA_MODIFICATION;
    logSecurityEvent(eventType, details);
};

// Clean up old login attempts (run periodically)
setInterval(() => {
    const now = Date.now();
    for (const [key, attempts] of loginAttempts.entries()) {
        if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
            loginAttempts.delete(key);
        }
    }
}, 60000); // Clean up every minute

module.exports = {
    EventTypes,
    logSecurityEvent,
    logRequest,
    trackLoginAttempt,
    isAccountLocked,
    getRemainingLockoutTime,
    logFileUpload,
    logDataModification
};
