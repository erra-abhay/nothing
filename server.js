const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const { logRequest, logSecurityEvent, EventTypes } = require('./middleware/securityLogger');
const db = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// Security: Disable X-Powered-By header
app.disable('x-powered-by');

// Trust proxy - important for rate limiting and IP detection
app.set('trust proxy', 1);

// Helmet - Comprehensive security headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // TODO: Remove 'unsafe-inline' after extracting inline scripts from admin-panel.html & faculty-portal.html
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            frameSrc: ["'none'"],
            objectSrc: ["'none'"]
            // upgradeInsecureRequests removed to support both HTTP and HTTPS
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Additional security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
});

// CORS configuration - restrict to specific origins in production
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : 'http://localhost:3000')
        : '*',
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
};
app.use(cors(corsOptions));

// Body parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// NoSQL Injection Prevention
app.use(mongoSanitize({
    replaceWith: '_',
    onSanitize: ({ req, key }) => {
        logSecurityEvent(EventTypes.SUSPICIOUS_ACTIVITY, {
            type: 'NoSQL injection attempt',
            key,
            ip: req.ip,
            path: req.path
        });
    }
}));

// HTTP Parameter Pollution Protection
app.use(hpp());

// Security logging for all requests
app.use(logRequest);

// Global rate limiter - applies to all routes
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logSecurityEvent(EventTypes.RATE_LIMIT_EXCEEDED, {
            ip: req.ip,
            path: req.path,
            limit: 'global'
        });
        res.status(429).json({
            error: 'Too many requests from this IP, please try again later.'
        });
    }
});
app.use(globalLimiter);

// API rate limiter - stricter for API endpoints
const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per minute
    message: 'Too many API requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logSecurityEvent(EventTypes.RATE_LIMIT_EXCEEDED, {
            ip: req.ip,
            path: req.path,
            limit: 'api'
        });
        res.status(429).json({
            error: 'Too many API requests, please try again later.'
        });
    }
});
app.use('/api/', apiLimiter);

// Login rate limiter - very strict for login endpoints
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 login attempts per 15 minutes
    message: 'Too many login attempts, please try again later.',
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logSecurityEvent(EventTypes.RATE_LIMIT_EXCEEDED, {
            ip: req.ip,
            path: req.path,
            limit: 'login'
        });
        res.status(429).json({
            error: 'Too many login attempts. Please try again after 15 minutes.'
        });
    }
});

// Apply login rate limiter to login routes
app.use('/api/faculty/login', loginLimiter);
app.use('/api/admin/login', loginLimiter);
app.use('/api/auth/login', loginLimiter);

// Download rate limiter
const downloadLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // Limit each IP to 20 downloads per minute
    message: 'Too many downloads, please try again later.',
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/public/papers/:id/download', downloadLimiter);

// Serve static files with security
app.use(express.static('public', {
    dotfiles: 'deny',
    index: 'index.html',
    setHeaders: (res, filePath) => {
        // Prevent directory listing
        if (filePath.endsWith('/')) {
            res.status(403).end();
        }
    }
}));

// Block direct access to uploads - files served only via /api/public/papers/:id/download
app.use('/uploads', (req, res) => {
    logSecurityEvent('FILE_ACCESS_BLOCKED', {
        path: req.path,
        ip: req.ip
    });
    res.status(403).json({ error: 'Direct file access denied. Use the download API.' });
});

// Import routes
const publicRoutes = require('./routes/public');
const facultyRoutes = require('./routes/faculty');
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');

// Use routes
app.use('/api/public', publicRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);

// GET /api/me — backend source of truth for user identity
const { authenticateToken } = require('./middleware/auth');
app.get('/api/me', authenticateToken, (req, res) => {
    res.json({
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        department_id: req.user.department_id
    });
});

// Logout route — clears httpOnly auth cookie
app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/'
    });
    res.json({ success: true, message: 'Logged out successfully' });
});

// Health check endpoint for Docker
app.get('/health', (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(200).json({ status: 'healthy' });
    }
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Security: Prevent path traversal
app.use((req, res, next) => {
    const decodedPath = decodeURIComponent(req.path);
    if (decodedPath.includes('..') || decodedPath.includes('~')) {
        logSecurityEvent(EventTypes.PATH_TRAVERSAL_ATTEMPT, {
            path: req.path,
            decodedPath,
            ip: req.ip
        });
        return res.status(403).json({ error: 'Forbidden' });
    }
    next();
});

// Error handling middleware
app.use((err, req, res, next) => {
    // Log error for monitoring
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        path: req.path,
        method: req.method,
        ip: req.ip
    });

    logSecurityEvent('ERROR', {
        message: err.message,
        path: req.path,
        method: req.method,
        ip: req.ip,
        statusCode: err.status || 500
    });

    // Handle Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
            error: 'File too large. Maximum size is 10MB.'
        });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
            error: 'Unexpected file upload.'
        });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
            error: 'Too many files. Only 1 file allowed per upload.'
        });
    }

    // Handle validation errors
    if (err.message && err.message.includes('Only PDF and DOCX')) {
        return res.status(400).json({
            error: err.message
        });
    }

    // Generic error response
    res.status(err.status || 500).json({
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    logSecurityEvent('NOT_FOUND', {
        path: req.path,
        method: req.method,
        ip: req.ip
    });
    res.status(404).json({ error: 'Route not found' });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`\nServer running on http://localhost:${PORT}`);
    console.log(`Question Paper Repository System`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Security: Enhanced with Helmet, Rate Limiting, and Advanced Protection`);
    console.log(`Allowed file types: PDF, DOCX`);
    console.log(`Security Features:`);
    console.log(`   - Helmet.js security headers`);
    console.log(`   - Advanced rate limiting (Global, API, Login, Download)`);
    console.log(`   - NoSQL injection prevention`);
    console.log(`   - HTTP Parameter Pollution protection`);
    console.log(`   - File magic number validation`);
    console.log(`   - Comprehensive security logging`);
    console.log(`   - Session security with device fingerprinting`);
    console.log(`   - Brute force protection`);
    console.log(`   - Auto JWT token refresh on activity`);
    console.log(`   - Background stale session cleanup (every 5 min)\n`);
});

// Background job: Clean up stale sessions from DB every 5 minutes
setInterval(async () => {
    try {
        const [result] = await db.query(
            `UPDATE users SET session_token = NULL, session_created_at = NULL 
             WHERE session_created_at IS NOT NULL 
             AND TIMESTAMPDIFF(SECOND, session_created_at, UTC_TIMESTAMP()) > ?`,
            [30 * 60]
        );
        if (result.affectedRows > 0) {
            console.log(`[Session Cleanup] Cleared ${result.affectedRows} stale session(s)`);
        }
    } catch (err) {
        console.error('[Session Cleanup] Error:', err.message);
    }
}, 5 * 60 * 1000);

// Graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    server.close(() => {
        console.log('HTTP server closed');

        // Close database connections
        db.end((err) => {
            if (err) {
                console.error('Error closing database:', err);
                process.exit(1);
            }
            console.log('Database connections closed');
            console.log('Graceful shutdown completed');
            process.exit(0);
        });
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;


